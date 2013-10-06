var esprima = require("esprima");
var colors = require("colors");
var exec = require("child_process").exec;
var fs = require("fs");

var hook = process.argv[2];

if (hook != "pre-commit") {
    console.error("This is only going to work with pre-commit");
} else {
    //TODO: it would be sweet if hooks had an api that gave me these... 
    exec("git diff --cached --name-status --diff-filter=AMR", function(err, stdout, stderr) {
        if (err) {
            console.log("GIT ERROR".red);
            console.log(err);
            process.exit(1);
        } else if (stderr) {
            console.log(stderr);
            process.exit(1);
        } else {
            var lines = stdout.split("\n");
            var iLines = lines.length;
            var files_with_errors = 0;
            while (iLines--) {
                var line = lines[iLines];
                if (line != "") {
                    var filename = line.split("\t")[1];
                    var found = filename.match(/\.js$/g);
                    //console.log(filename, found);
                    if (found) {
                        var ugly;
                        try {
                            ugly = fs.readFileSync(filename, {
                                encoding: "utf8"
                            });
                        } catch (err) {
                            console.log(filename + ": ERROR".red);
                            console.log(err.message);
                            process.exit(1);
                        }

                        var errors = undefined;
                        try {
                            errors = esprima.parse(ugly, {
                                tolerant: true
                            }).errors;
                        } catch (err) {
                            errors = ["Error: " + err.message];
                        }

                        if (errors.length != 0) {
                            var iErrors = errors.length;
                            console.log(filename + ": INVALID".red);
                            var out = "";
                            while (iErrors--) {
                                out = "\t" + errors[iErrors] + "\n" + out;
                            }
                            process.stdout.write(out.red);
                            files_with_errors++;
                        } else {
                            console.log(filename + ": VALID".green);
                        }
                    } else {
                        console.log(filename + ": SKIPPED".yellow);
                    }
                }
            }

            if (files_with_errors > 0) {
                console.log("Fix above errors before trying to commit");
                process.exit(1);
            }
        }
    });
}