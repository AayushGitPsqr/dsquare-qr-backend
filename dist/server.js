import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { logError, logInfo } from "./utils/logger.js";
async function bootstrap() {
    await connectDatabase();
    const app = createApp();
    app.listen(env.port, () => {
        logInfo(`Business Card Scanner API listening on port ${env.port}`);
    });
}
bootstrap().catch((error) => {
    logError("Failed to start server", error);
    process.exit(1);
});
