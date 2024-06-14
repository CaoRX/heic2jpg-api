import sharp from "sharp";

export const handler = async (event) => {
  const base64Image = JSON.parse(event.body).image;
  const imageBuffer = Buffer.from(base64Image, 'base64');

  const outputBuffer = await sharp(imageBuffer).jpeg().toBuffer();
  const base64Output = outputBuffer.toString('base64');

  const response = {
    statusCode: 200,
    Headers: {
      "Content-Type": "image/jpeg",
    },
    body: base64Output,
  };

  console.log("Sending response...");
  return response;
}