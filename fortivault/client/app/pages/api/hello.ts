// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import BackupCodes from "@/utils/encriptation/BackupCodes";

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
  const codes = backupCodes.generateInitializers();
  const subgroups = backupCodes.generateInitialSubgroups(backupCodes.generateInitialGroups());
  const datagroup = backupCodes.generateGroupEncripted(subgroups as { [key: number]: { [key: number]: string } });
  const passkey = backupCodes.generateEncriptarionKey(datagroup as {[key: string]: string});
  res.status(200).json({ name: codes, data: subgroups, datagroup, key: passkey });
}