
import dotenv from 'dotenv';
import {app} from "./app.ts";

import {db} from "./db/db.ts";

dotenv.config();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
})