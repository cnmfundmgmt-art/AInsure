const fs = require('fs');
const path = 'app/insurance/page.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Find line 1061 which should be ' )}' (closing the clientIncome check) and line 1062 which should be ' </div>'
// The pattern is:
// 1060:  </div>
// 1061:  )}    <- this closes {clientIncome == null && (  at line 1050
// 1062:  </div> <- this closes the intake form div
// But currently line 1062 is ' )}' and line 1063 is ' </div>'

// We need to change:
// Line 1061: )}  -> )}
// Line 1062: </div>  -> </div>
// Wait, let me re-examine. Line 1050: {clientIncome == null && (
// Line 1054: </p>
// Line 1055: )}
// Line 1056: <p ...>
// Line 1057: <CheckCircle ... /> ...
// Line 1058: </p>
// Line 1059: )}
// Line 1060: </div>   <- closes the intake panel/container
// Line 1061: )}        <- closes the intakeOpen conditional
// Line 1062: </div>    <- closes the space-y-3 div
// Line 1063: [empty]

// Current state: lines[1060] = ' </div>', lines[1061] = ' )}', lines[1062] = ' </div>'

// Target fix: lines[1061] = ' )}' and lines[1062] = ' </div>' and we need one more </div>

// Actually the issue is that line 1060 closes the inner content area, but we have an extra </div>
// Let me look at what each line corresponds to by checking the content

console.log('Current lines around the issue:');
for (let i = 1045; i <= 1068; i++) {
  console.log((i+1) + ': ' + lines[i]);
}