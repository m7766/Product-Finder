const http = require("http");
const fs = require("fs");
const path = require("path");
const { formidable } = require("formidable");
const { execFile } = require("child_process");

const pythonPath = path.join(
    __dirname,
    ".venv312",
    "Scripts",
    "python.exe"
);

const analyzerPath = path.join(
    __dirname,
    "analyze_image.py"
);

const server = http.createServer((req, res) => {

    if (req.url === "/" && req.method === "GET") {
        try {
            const html = fs.readFileSync(
                path.join(__dirname, "index.html"),
                "utf8"
            );

            res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8"
});

            res.end(html);
        } catch (error) {
            res.writeHead(500, {
                "Content-Type": "text/plain; charset=utf-8"
            });

            res.end("تعذر فتح صفحة الموقع.");
        }

        return;
    }

    if (req.url === "/analyze" && req.method === "POST") {

        const form = formidable({
            uploadDir: __dirname,
            keepExtensions: true,
            maxFiles: 1,
            maxFileSize: 10 * 1024 * 1024
        });

        form.parse(req, (err, fields, files) => {

            if (err) {
                res.writeHead(400, {
                    "Content-Type": "application/json; charset=utf-8"
                });

                res.end(JSON.stringify({
                    success: false,
                    result: "حدث خطأ أثناء رفع الصورة."
                }));

                return;
            }

            const uploadedFile = Array.isArray(files.image)
                ? files.image[0]
                : files.image;

            if (!uploadedFile) {
                res.writeHead(400, {
                    "Content-Type": "application/json; charset=utf-8"
                });

                res.end(JSON.stringify({
                    success: false,
                    result: "لم يتم استلام الصورة."
                }));

                return;
            }

            execFile(
                pythonPath,
                [
                    analyzerPath,
                    uploadedFile.filepath
                ],
                {
                    timeout: 180000,
                    maxBuffer: 1024 * 1024
                },
                (error, stdout, stderr) => {

                    try {
                        if (error) {
                            console.error(
                                "خطأ بايثون:",
                                stderr || error.message
                            );

                            res.writeHead(500, {
                                "Content-Type": "application/json; charset=utf-8"
                            });

                            res.end(JSON.stringify({
                                success: false,
                                result: "حدث خطأ أثناء تحليل الصورة. راجعي نافذة CMD."
                            }));

                            return;
                        }

                        res.writeHead(200, {
                            "Content-Type": "application/json; charset=utf-8"
                        });

res.end(JSON.stringify({
    success: true,
    result: (stdout || "لم تظهر نتائج.")
    .replace(/puck, hockey puck/gi, "قرص هوكي")
    .replace(/face powder/gi, "بودرة وجه")
    .replace(/bottlecap/gi, "غطاء زجاجة")
    .replace(/pill bottle/gi, "عبوة حبوب")
    .replace(/ping-pong ball/gi, "كرة تنس الطاولة")
    .trim()
}));



                    } finally {
                        try {
                            fs.unlinkSync(uploadedFile.filepath);
                        } catch (e) {
                            console.log("تعذر حذف الملف المؤقت.");
                        }
                    }
                }
            );
        });

        return;
    }

    res.writeHead(404, {
        "Content-Type": "text/plain; charset=utf-8"
    });

    res.end("الصفحة غير موجودة");
});

server.listen(3000, () => {
    console.log("Product Finder يعمل على http://localhost:3000");
    console.log("تم ربط الموقع ببايثون.");
});