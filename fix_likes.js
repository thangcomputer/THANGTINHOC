const fs = require('fs');
let c = fs.readFileSync('client/src/pages/CoursePlayer.jsx', 'utf8');

// The old block uses CRLF in the file
const searchStr = 'className="fb-action-btn reaction-toggle"';
if (c.includes(searchStr)) {
  // Find the start of the surrounding div
  const idx = c.indexOf(searchStr);
  const divStart = c.lastIndexOf('<div style={{ position:', idx);
  // Find the closing </div> after it
  const divEnd = c.indexOf('</div>', idx) + '</div>'.length;
  const oldBlock = c.substring(divStart, divEnd);
  console.log('Found block:', JSON.stringify(oldBlock.substring(0, 100)));
  c = c.substring(0, divStart) + '<FbLikeBtn commentId={r.id} />' + c.substring(divEnd);
  fs.writeFileSync('client/src/pages/CoursePlayer.jsx', c, 'utf8');
  console.log('Done!');
} else {
  console.log('reaction-toggle class not found at all');
}
