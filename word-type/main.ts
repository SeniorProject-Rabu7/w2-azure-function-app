import type { AzureFunction, Context, HttpRequest } from "@azure/functions";

const wordTypeApi: AzureFunction = async (
    ctx: Context & { bindings: { dbWrite: WordType | WordType[] } },
    req: HttpRequest,
    dbRead: WordType[]
) => {
    switch (req.method) {
        case "GET":
            const { word: requestedWord } = req.query;

            if (!requestedWord) {
                ctx.res = {
                    status: 400, // Bad request
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        status: "failure",
                        message: "No `word` parameter is supplied!"
                    })
                };
                return;
            }

            const wordEntry = dbRead.filter((item) => item.spelling && item.spelling.toLowerCase() === requestedWord?.toLowerCase());
            if (wordEntry.length === 0) {
                ctx.res = {
                    status: 404, // The requested word is not found on the server/db
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        status: "not-found",
                        message: `Word "${requestedWord}" not found in current database!`
                    })
                };
                return; // or `break`?
            }

            ctx.res = {
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(wordEntry.map(({ spelling, type }) => ({ spelling, type })))
            };
            break;

        case "POST":
            if (!req.body || !req.body.spelling || !req.body.type) {
                ctx.res = {
                    status: 400, // Bad request
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        status: "failure",
                        message: "Request body is malformed or no body is supplied!"
                    })
                };
                return;
            }

            // Apparently the returned header keys were automatically converted to lowercase
            if (req.headers["content-type"] !== "application/json") {
                ctx.res = {
                    status: 400, // Bad request
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        status: "failure",
                        message: "Content-Type not supported!"
                    })
                };
                return;
            }

            ctx.bindings.dbWrite = req.body;
            ctx.res = {
                body: JSON.stringify({
                    status: "success",
                    message: `Word "${req.body.spelling}" successfully added to the database`
                })
            }
            break;

        default:
            ctx.log(`HTTP method ${req.method} not implemented yet!`);
            ctx.res = {
                status: 405 // Bad method
            };
            break;
    }
};

export default wordTypeApi;
