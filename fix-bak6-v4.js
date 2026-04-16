const fs = require('fs');
const path = 'app/insurance/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// bak6 has:
// 925: const getLeftSidebar = () => (
// 926: <>
// 927: <div className="space-y-3">
// ...
// 1080: <div>    (ProductBrowser wrapper)
// 1081: <ProductBrowser.../>
// 1082: </div>
// 1083: </>    <- Fragment closer - NOT NEEDED if we use just the div wrapper
// 1084: );
// 1085: ""
// 1086: return (

// Fix: Remove the <> fragment and change the ); to close the div properly
// The pattern to change:
// Line 926: <>  --> delete this line
// Line 1083: </> --> change to </div>
// Line 1084: ); --> change to );

// Actually simpler: just replace the whole getLeftSidebar to NOT use fragment
// const getLeftSidebar = () => (
// <div className="space-y-3">
//   ... all content ...
// </div>
// );

let lines = content.split('\n');
console.log('Line 925:', JSON.stringify(lines[924]));
console.log('Line 926:', JSON.stringify(lines[925]));
console.log('Line 927:', JSON.stringify(lines[926]));
console.log('Line 1082:', JSON.stringify(lines[1081]));
console.log('Line 1083:', JSON.stringify(lines[1082]));
console.log('Line 1084:', JSON.stringify(lines[1083]));

// Change line 926 from '<>' to nothing (remove it)
lines[925] = '';

// Change line 1083 from '</>' to '</div>'
lines[1082] = ' </div>';

// Now the structure is:
// Line 925: const getLeftSidebar = () => (
// Line 926: (empty)
// Line 927: <div className="space-y-3">
// ...
// Line 1082: </div>  (closes space-y-3)
// Line 1083: </div>  (was </>, now </div> - but this extra </div> is wrong)
// Line 1084: );

// Wait - if we just remove <> and change </> to </div>, we get:
// - space-y-3 opens at 927
// - space-y-3 closes at 1082 (</div> from ProductBrowser wrapper is at 1081, space-y-3 close should be after)
// Actually line 1082 was </> which becomes </div>
// And we need space-y-3 to close BEFORE the );
// But there's only one </div> after this change (1082) and it's supposed to close space-y-3
// So line 1083 (now </div>) would be an EXTRA </div>

// Hmm, let me think again:
// space-y-3 opened at 927
// Inside it we have: intake form, SessionHistory section, ProductBrowser section
// SessionHistory div at 1065, closes at 1076
// ProductBrowser div at 1078, closes at 1080
// intake form div closes at ~1062
// All these are INSIDE space-y-3
// So the </div> that closes space-y-3 should be right before );
// Currently we have </> at 1083 and ) at 1084
// If we change </> to </div>, we get: ... ProductBrowser closes ... </div> ... </div> ... );
// That's two </div> in a row (1082 and 1083)

// Wait - but in our current file (after the earlier partial fix):
// Line 1080: </div> (closes ProductBrowser wrapper)  
// Line 1081: </> (fragment close - WRONG)
// Line 1082: </div> (should close space-y-3, but it's also extra?)
// Line 1083: );

// So the correct structure should be:
// ... ProductBrowser wrapper closes ... </div> (line 1080)
// space-y-3 closes: </div> (should be line 1081, before fragment close or instead of extra </div>)
// fragment close: </> (line 1082 or removed entirely)
// );

// If we use just a div wrapper (no fragment), we need:
// ... </div> (closes ProductBrowser wrapper) 
// </div> (closes space-y-3) 
// );  (closes the function)

// So we need to REMOVE the </> and change the pattern so only one </div> remains before );

// Let me re-examine. After removing <>, we have:
// line 925: const getLeftSidebar = () => (
// line 927: <div className="space-y-3">
// ...
// line 1080: </div> (closes ProductBrowser wrapper div at 1078)
// line 1081: (empty - was </>)  
// line 1082: </div> (should close space-y-3)
// line 1083: );

// Wait but line 1082 was originally </> and now we change it to </div>
// So we get:
// 1080: </div>
// 1081: (empty)
// 1082: </div>
// 1083: );

// This is actually CORRECT! Two </div>: 1080 closes ProductBrowser, 1082 closes space-y-3
// But we need to remove the empty line or keep it.

// Actually, let me just check the original bak6 again more carefully.
// Original bak6 lines around the close area:
// 1078: <div>
// 1079: <ProductBrowser .../>
// 1080: </div>  <- closes ProductBrowser wrapper
// 1081: </>      <- closes fragment
// 1082: </div>   <- closes space-y-3  
// 1083: );       <- closes function

// So space-y-3 closes at line 1082 (</div>)
// But line 1081 (</>) is before it, which is wrong because we need </> AFTER </div>
// Wait no - the fragment is outer, so </> should come AFTER </div>
// But </> at 1081 comes BEFORE </div> at 1082
// That means </div> at 1082 is closing the fragment or something is wrong

// Let me look at the actual file context again by re-reading bak6
const bak6 = fs.readFileSync('app/insurance/page.tsx.bak6', 'utf8');
const bak6Lines = bak6.split('\n');
console.log('\n=== bak6 exact lines 1075-1086 ===');
for (let i = 1074; i <= 1085; i++) {
  console.log((i+1) + ': ' + bak6Lines[i]);
}

fs.writeFileSync(path, lines.join('\n'));
console.log('\nWrote file');
console.log('New line 925:', JSON.stringify(lines[924]));
console.log('New line 926:', JSON.stringify(lines[925]));
console.log('New line 1082:', JSON.stringify(lines[1081]));
console.log('New line 1083:', JSON.stringify(lines[1082]));
console.log('New line 1084:', JSON.stringify(lines[1083]));