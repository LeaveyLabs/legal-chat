import type { NextApiRequest, NextApiResponse } from 'next';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { pinecone } from '@/utils/pinecone-client';
import { CustomPDFLoader } from '@/utils/customPDFLoader';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';
import formidable from 'formidable'

// import nextConnect from 'next-connect';

// const upload = multer({
//   storage: multer.diskStorage({
//     destination: './public/uploads',
//     filename: (req, file, cb) => cb(null, file.originalname),
//   }),
// });

// const apiRoute = nextConnect({
//   onError(error, req, res) {
//     res.status(501).json({ error: `Sorry something Happened! ${error.message}` });
//   },
//   onNoMatch(req, res) {
//     res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
//   },
// });

// apiRoute.use(upload.array('theFiles'));

// apiRoute.post((req, res) => {
//   res.status(200).json({ data: 'success' });
// });

// export default apiRoute;

// export const config = {
//   api: {
//     bodyParser: false, // Disallow body parsing, consume as stream
//     sizeLimit: '10mb' // Set desired value here
//   },
// };


// const upload = multer({ dest: 'uploads/' });

// pages/api/upload.js

export const config = {
    api: {
        bodyParser: false,
    },
};

import nextConnect from 'next-connect';
import fs from 'fs';
import path from 'path';
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";

const handler = nextConnect();

handler.post(async (req:NextApiRequest, res:NextApiResponse) => {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files:any) => {
    if (err) {
      console.error('Error processing the file', err);
      res.status(500).json({ message: 'Error processing the file' });
      return;
    }
    const pdfFile = files.doc;
    const text = fields.text;
    const webpage = fields.html;

    if (pdfFile) {
      // Save the PDF file to the server or process it as needed
      const outputPath = path.join(process.cwd(), 'uploads', `${pdfFile.newFilename}.pdf`);
      fs.writeFileSync(outputPath, fs.readFileSync(pdfFile.filepath));

      try {
        // console.log(req.file)
        console.log(outputPath)

        const loader = new CustomPDFLoader(outputPath)
        
        const rawDoc = await loader.load();

        /* Split text into chunks */
        const textSplitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
        });
    
        const docs = await textSplitter.splitDocuments(rawDoc);
        console.log('split docs', docs);
    
        console.log('creating vector store...');
        /*create and store the embeddings in the vectorStore*/
        const embeddings = new OpenAIEmbeddings();
        console.log(embeddings)
        const index = pinecone.Index(PINECONE_INDEX_NAME); //change to your own index name
        //embed the PDF documents
        await PineconeStore.fromDocuments(docs, embeddings, {
          pineconeIndex: index,
          namespace: PINECONE_NAME_SPACE,
          textKey: 'text',
        });
        res.status(200).json({ message: "pdf success" });
      } catch (error) {
        console.log('error', error);
        res.status(400).json({ message: "pdf failed" });
      }
    } else if (text) {
      try {
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const docs = await textSplitter.createDocuments([text.toString()])
        console.log('split docs', docs);
    
        console.log('creating vector store...');
        /*create and store the embeddings in the vectorStore*/
        const embeddings = new OpenAIEmbeddings();
        console.log(embeddings)
        const index = pinecone.Index(PINECONE_INDEX_NAME); //change to your own index name
        //embed the PDF documents
        await PineconeStore.fromDocuments(docs, embeddings, {
        pineconeIndex: index,
        namespace: PINECONE_NAME_SPACE,
        textKey: 'text',
        });
        res.status(200).json({ message: "pdf success" });
      } catch (error) {
          console.log('error', error);
          res.status(400).json({ message: "pdf failed" });
      }
    } else if (webpage) {
        try {
            console.log(webpage)
            const loader = new PuppeteerWebBaseLoader(webpage.toString());
            const rawDoc = await loader.load();
            /* Split text into chunks */
            const textSplitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200,
            });
        
            const docs = await textSplitter.splitDocuments(rawDoc);
            console.log('split docs', docs);
        
            console.log('creating vector store...');
            /*create and store the embeddings in the vectorStore*/
            const embeddings = new OpenAIEmbeddings();
            console.log(embeddings)
            const index = pinecone.Index(PINECONE_INDEX_NAME); //change to your own index name
            //embed the PDF documents
            await PineconeStore.fromDocuments(docs, embeddings, {
            pineconeIndex: index,
            namespace: PINECONE_NAME_SPACE,
            textKey: 'text',
            });
            res.status(200).json({ message: "pdf success" });
        } catch (error) {
            console.log('error', error);
            res.status(400).json({ message: "pdf failed" });
        }
    } else {
      res.status(400).json({ message: 'Invalid file format' });
    }
  });
});

export default handler;

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse,
// ) {
//     if (req.method != 'POST') {
//         res.status(405).send('Method not allowed');
//     }
//     // console.log(req.body)
   
//     // upload.single('pdfFile')(req, res, (error: any) => {
//     //     if (error) {
//     //     console.error(error);
//     //     res.status(400).send('Upload failed');
//     //     } else {
//     //     // Handle the uploaded PDF file here
//     //     console.log(req.file);
//     //     res.status(200).send('Upload successful');
//     //     }
//     // });
//     // Create a new formidable form object
//     const form = formidable({ multiples: true })

//     // Parse the incoming request and handle the form data
//     form.parse(req, (err, fields, files) => {
//         if (err) {
//         console.error(err);
//         return;
//         }

//         // Access the fields and files in the form data
//         const name = fields.name;
//         const pdfFile = files.pdf;
//         console.log(name)

//         // Do something with the form data
//         // ...

//         // Send a response back to the client
//         res.status(200).json({ message: 'Form data received successfully.' });
//     });


//     // try {
//     //     // console.log(req.file)
//     //     const rawDoc = await new PDFLoader(req.body).load();
    
//     //     /* Split text into chunks */
//     //     const textSplitter = new RecursiveCharacterTextSplitter({
//     //       chunkSize: 1000,
//     //       chunkOverlap: 200,
//     //     });
    
//     //     const docs = await textSplitter.splitDocuments(rawDoc);
//     //     console.log('split docs', docs);
    
//     //     console.log('creating vector store...');
//     //     /*create and store the embeddings in the vectorStore*/
//     //     const embeddings = new OpenAIEmbeddings();
//     //     const index = pinecone.Index(PINECONE_INDEX_NAME); //change to your own index name
    
//     //     //embed the PDF documents
//     //     await PineconeStore.fromDocuments(docs, embeddings, {
//     //       pineconeIndex: index,
//     //       namespace: PINECONE_NAME_SPACE,
//     //       textKey: 'text',
//     //     });
//     //     res.status(200);
//     //   } catch (error) {
//     //     console.log('error', error);
//     //     res.status(400);
//     //   }
// }
