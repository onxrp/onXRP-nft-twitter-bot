
import { log } from "./utils/logger";
import { runApplication } from "./app";

log("Running program!")

runApplication()
    .catch(err => {
        log(err.toString());
        log("Program stopped executing!");
    });