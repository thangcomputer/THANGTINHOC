const fs = require("fs");
const msg = "\u0110\u00e3 t\u1ef1 \u0111\u1ed9ng \u0111\u0103ng xu\u1ea5t do kh\u00f4ng ho\u1ea1t \u0111\u1ed9ng 1 gi\u1edd.";
const old = "toast.error('Da tu dong dang xuat do khong hoat dong 1 gio.');";
const neu = "toast.error('" + msg + "');";
for (const p of [
  "c:/Users/thang/Desktop/WEB/client/src/lib/useIdleLogout.js",
  "c:/Users/thang/Desktop/WEB/admin/src/lib/useIdleLogout.js"
]) {
  let s = fs.readFileSync(p, "utf8");
  s = s.split(old).join(neu);
  fs.writeFileSync(p, s, "utf8");
}
console.log("fixed");