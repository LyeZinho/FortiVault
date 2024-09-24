// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import BackupCodes from "@/utils/encriptation/BackupCodes";
import { code } from "framer-motion/client";

type Data = {
  name: string;
  data: any,
  datagroup: any,
  key: any
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  const backupCodes = new BackupCodes();

  backupCodes.setupInitializers();

  const initialGroups = backupCodes.generateInitialGroups();
  
  const subgroups = backupCodes.generateInitialSubgroups(initialGroups as string[]);
  
  const datagroup = backupCodes.generateGroupEncripted(subgroups as { [key: number]: { [key: number]: string } });
  
  const passkey = backupCodes.generateEncriptarionKey(datagroup as {[key: string]: string});
  
  res.status(200).json({ name: backupCodes.getInitializers(), data: subgroups, datagroup, key: passkey });
  
  // res.status(200).json({ 
  //   name: "",
  //   data: "",
  //   datagroup: "",
  //   key: ""
  // });
}