
const http = require('http');
const fs = require('fs');
const { MongoClient } = require('mongodb');

const url = "mongodb://127.0.0.1:27017";
const client = new MongoClient(url);

async function startServer() {

    try {

        // Connect to MongoDB
        await client.connect();

        console.log("MongoDB Connected Successfully");

        const db = client.db("registrationDB");
        const collection = db.collection("users");

        // Create HTTP Server
        const server = http.createServer(async function(req, res) {

            // Display Home Page
            if (req.url === "/" && req.method === "GET") {

                res.writeHead(200, {
                    "Content-Type": "text/html"
                });

                fs.createReadStream("./home.html").pipe(res);

            }

            // Process Registration Form
            else if (req.url === "/server" && req.method === "POST") {

                let rawData = "";

                req.on("data", function(chunk) {
                    rawData += chunk;
                });

                req.on("end", async function() {

                    try {

                        const formData = new URLSearchParams(rawData);

                        const user = {
                            name: formData.get("name"),
                            email: formData.get("email"),
                            mobile: formData.get("mobile"),
                            age: Number(formData.get("age")),
                            gender: formData.get("gender"),
                            address: formData.get("address")
                        };

                        // Server-side validation
                        if (
                            !user.name ||
                            !/^[A-Za-z ]+$/.test(user.name) ||
                            !user.email ||
                            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email) ||
                            !/^[0-9]{10}$/.test(user.mobile) ||
                            !Number.isInteger(user.age) ||
                            user.age < 18 || user.age > 60 ||
                            !user.gender ||
                            !user.address
                        ) {
                            res.writeHead(400, {
                                "Content-Type": "text/html"
                            });

                            res.end("<h2>Invalid form details. Please go back and try again.</h2>");
                            return;
                        }

                        // Insert data into MongoDB
                        await collection.insertOne(user);

                        // Retrieve data from MongoDB
                        const users = await collection.find({}).toArray();

                        // Function to prevent HTML injection
                        function escapeHTML(value) {
                            return String(value).replace(/[&<>"']/g, function(ch) {
                                return {
                                    '&': '&amp;',
                                    '<': '&lt;',
                                    '>': '&gt;',
                                    '"': '&quot;',
                                    "'": '&#39;'
                                }[ch];
                            });
                        }

                        // Display submitted details
                        let output = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Registration Details</title>
                            <style>
                                body {
                                    font-family: Arial;
                                    text-align: center;
                                    background-color: lightblue;
                                }

                                table {
                                    margin: 30px auto;
                                    border-collapse: collapse;
                                    background-color: white;
                                    width: 90%;
                                }

                                th, td {
                                    border: 1px solid black;
                                    padding: 10px;
                                }

                                th {
                                    background-color: navy;
                                    color: white;
                                }

                                h2 {
                                    color: navy;
                                }
                            </style>
                        </head>

                        <body>

                            <h2>Registration Successful!</h2>

                            <h3>User Registration Details</h3>

                            <table>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Mobile</th>
                                    <th>Age</th>
                                    <th>Gender</th>
                                    <th>Address</th>
                                </tr>
                        `;

                        users.forEach(function(u) {

                            output += `
                            <tr>
                                <td>${escapeHTML(u.name)}</td>
                                <td>${escapeHTML(u.email)}</td>
                                <td>${escapeHTML(u.mobile)}</td>
                                <td>${escapeHTML(u.age)}</td>
                                <td>${escapeHTML(u.gender)}</td>
                                <td>${escapeHTML(u.address)}</td>
                            </tr>
                            `;

                        });

                        output += `
                            </table>

                            <a href="/">Go Back to Registration</a>

                        </body>
                        </html>
                        `;

                        res.writeHead(200, {
                            "Content-Type": "text/html"
                        });

                        res.end(output);

                    } catch (error) {

                        console.error(error);

                        res.writeHead(500, {
                            "Content-Type": "text/html"
                        });

                        res.end("<h2>Error processing registration.</h2>");

                    }

                });

            }

            else {

                res.writeHead(404, {
                    "Content-Type": "text/html"
                });

                res.end("<h2>Page Not Found</h2>");

            }

        });

        // Start Server
        server.listen(6000, function() {
            console.log("Server running at http://localhost:6000");
        });

    } catch (error) {

        console.error("MongoDB connection failed:", error);

    }

}

startServer();
