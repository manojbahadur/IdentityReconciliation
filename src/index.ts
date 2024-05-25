import "reflect-metadata";
import { createConnection } from "typeorm";
import { Request, Response } from 'express';
import express from "express";
import contactRoutes from "./routes/contactRoutes";

const app = express();
const port = 3000;

app.use(express.json());
app.use('/api/contacts', contactRoutes);

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!');
  });

createConnection().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}).catch(error => console.log(error));
