// Example using Next.js API routes: /pages/api/members/[memberId]/attachments.js

import { getMemberAttachments } from "@components/Members/member";


export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { memberId } = req.params;
    
    try {
      const result = await getMemberAttachments(memberId);

      // You should modify the response as needed, possibly sending the attachments
      // directly or as links to download them.
      res.status(200).json(result);
    } catch (error) {
      console.error("Server error:", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" });
      res.status(500).json({ status: "error", message: "Server error" });
    }
  } else {
    // Handle any non-GET requests
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
