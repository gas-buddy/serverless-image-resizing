const AWS = require('aws-sdk');
const Sharp = require('sharp');

const S3 = new AWS.S3({
  signatureVersion: 'v4',
});

const BUCKET = process.env.BUCKET;
const URL = process.env.URL;
const ALLOWED_DIMENSIONS = new Set();
const MAX_AGE = 31536000; // seconds = 1 year
const MAX_SIZE = 10000; // 10 thousand pixels (wide or high)

if (process.env.ALLOWED_DIMENSIONS) {
  const dimensions = process.env.ALLOWED_DIMENSIONS.split(/\s*,\s*/);
  dimensions.forEach(dimension => ALLOWED_DIMENSIONS.add(dimension));
}

exports.handler = async (event, context, callback) => {
  const key = event.queryStringParameters.key;
  const match = key.match(/((\d+|auto)x(\d+|auto))\/(.*)/);
  if (!match) {
    callback(null, {
      statusCode: '404',
      headers: {},
      body: '',
    });
    return;
  }
  const dimensions = match[1];
  const width = match[2] === 'auto' ? null : Math.min(parseInt(match[2], 10), MAX_SIZE);
  const height = match[3] === 'auto' ? null : Math.min(parseInt(match[3], 10), MAX_SIZE);
  let originalKey = match[4];

  if (originalKey.includes('?')) {
    originalKey = match[4].split('?')[0]
  }

  if (ALLOWED_DIMENSIONS.size > 0 && !ALLOWED_DIMENSIONS.has(dimensions)) {
    callback(null, {
      statusCode: '404',
      headers: {},
      body: '',
    });
    return;
  }

  try {
    const data = await S3.getObject({ Bucket: BUCKET, Key: originalKey }).promise();
    // eslint-disable-next-line new-cap
    const buffer = await Sharp(data.Body)
      .resize(width, height)
      .toFormat('png')
      .toBuffer();
    await S3.putObject({
      Body: buffer,
      Bucket: BUCKET,
      ContentType: 'image/png',
      Key: key,
      CacheControl: `max-age=${MAX_AGE}`,
    }).promise();
  
    callback(null, {
      statusCode: '301',
      headers: {
        location: `${URL}/${key}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
      body: '',
    });
  } catch (err) { 
     if (err.code === 'AccessDenied' || err.code === 'NoSuchKey' ) {
        callback(null, {
          statusCode: '404',
          headers: {},
          body: '',
        });
        console.log(`Original image ${originalKey} not found`);
      }
      else {
        callback(err);
      }
    }
}
