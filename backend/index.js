const dotenv = require("dotenv");
const app = require("./app");
dotenv.config();

app.get("/", (req, res) => {
  res.send("WELCOME HOME BRUH!!!");
});


const PORT = process.env.PORT || 5555;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
