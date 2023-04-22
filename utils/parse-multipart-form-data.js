// utils/parse-multipart-form-data.js
import Busboy from 'busboy';

export async function parseMultipartFormData(req) {
  return new Promise((resolve, reject) => {
    const data = {};
    const busboy = new Busboy({ headers: req.headers });

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      const chunks = [];

      file.on('data', (chunk) => {
        chunks.push(chunk);
      });

      file.on('end', () => {
        data[fieldname] = {
          filename,
          encoding,
          mimetype,
          content: Buffer.concat(chunks),
        };
      });
    });

    busboy.on('field', (fieldname, value) => {
      data[fieldname] = value;
    });

    busboy.on('finish', () => {
      resolve(data);
    });

    busboy.on('error', (error) => {
      reject(error);
    });

    req.pipe(busboy);
  });
}