const fs = require('fs');
const path = 'app/insurance/page.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);
console.log('Line 925:', JSON.stringify(lines[924]));

// The approach:
// 1. Replace `const leftSidebar = (` with `const getLeftSidebar = (() => { return (`  
// 2. The </div> that should close the function (instead of );) should be changed to `); })()`
// 3. All intermediate </div> that were for closing nested divs in the sidebar - we need to keep them as-is

// Let's look at what's around line 1084-1085 (the ); that closes getLeftSidebar)
console.log('\nAround getLeftSidebar closure (lines 1082-1090):');
for (let i = 1081; i <= 1089; i++) console.log((i+1) + ': ' + JSON.stringify(lines[i]));

// The key issue: lines 1082 (</>) and 1083 (</div>) need to be handled
// The current content has:
// 1079: <ProductBrowser.../>  
// 1080: </div>  
// 1081: </>    <- this is wrong, should be </div> to close the space-y-3 div
// 1082: </div>  <- was used to close space-y-3 but now we need it  
// 1083: );      <- this closes getLeftSidebar

// Wait, looking at it more carefully:
// - Line 1079 opens the ProductBrowser wrapper <div> at line 1078
// - Line 1080 closes that wrapper div  
// - But the </> at line 1081 is SUPPOSED to close the <> fragment
// - And the </div> at line 1082 is SUPPOSED to close space-y-3

// But we're missing a </div>! The fragment doesn't have a closing tag.
// We need: </> (line 1081) and </div> (line 1082) and );
// But where's the extra </div>?

// Actually I think the issue is simpler. The </> is CORRECT as the fragment closer.
// But we need to ADD a </div> before the fragment close to properly close space-y-3.

// Wait - let me look at this differently.
// Line 1078: <div>  (ProductBrowser wrapper)  
// Line 1079: content  
// Line 1080: </div> (closes ProductBrowser wrapper)
// Line 1081: </> (closes fragment - WRONG! should be </div> to close space-y-3)
// Line 1082: </div> (this is supposed to close something else?)
// Line 1083: ); (closes getLeftSidebar)

// But we have:
// - space-y-3 div opened at line 927
// - ProductBrowser wrapper div opened at line 1078
// So at end we need: </div> (ProductBrowser) + </div> (space-y-3) + </> (fragment) + );

// Current at 1078-1083:
// 1078: <div>
// 1079: <ProductBrowser.../>
// 1080: </div>  <- closes ProductBrowser wrapper
// 1081: </>     <- SHOULD close space-y-3, but it's a fragment close
// 1082: </div>  <- this is extraneous?
// 1083: );

// The correct structure should be:
// 1078: <div>
// 1079: <ProductBrowser.../>
// 1080: </div>  <- closes ProductBrowser wrapper
// 1081: </div>  <- closes space-y-3
// 1082: </>     <- closes fragment
// 1083: );

// But that means line 1082 needs to become </div> and we need to remove the extra stuff

// Actually - the cleanest fix: just make the whole leftSidebar content NOT use fragment
// Replace </> with </div> and adjust

// Let me try a targeted fix:
let newContent = content;

// Fix the closing - change lines 1080-1083 area
// Replace the pattern where </div> is followed by </> followed by );
// Change it to </div> followed by </div> followed by </> followed by );

const oldClosing = '\n </div>\n </>\n );\n';
const newClosing = '\n </div>\n </div>\n </>\n );\n';

if (content.includes(oldClosing)) {
  newContent = content.replace(oldClosing, newClosing);
  console.log('Fixed closing pattern!');
} else {
  console.log('Closing pattern not found, searching...');
  // Try to find the exact text
  const idx1080 = content.indexOf('\n </div>\n </>\n );\n');
  console.log('Found at index:', idx1080);
  if (idx1080 !== -1) {
    console.log('Context:', JSON.stringify(content.slice(idx1080, idx1080 + 100)));
  }
}

fs.writeFileSync(path, newContent);
const newLines = newContent.split('\n');
console.log('\nNew lines 1078-1088:');
for (let i = 1077; i <= 1087; i++) console.log((i+1) + ': ' + JSON.stringify(newLines[i]));