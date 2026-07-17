import "dotenv/config";

import { createApp } from "./app";

const port = Number(process.env.PORT) || 8000;
const app = createApp();

app.listen(port, () => {
  console.log(`TalkPath AI backend is running at http://127.0.0.1:${port}`);
});
