
function getResArray(a, b) {
    var alength = a.length + 1, blength = b.length + 1, ai = 0, bi = 0;
    var q = [], c;
    for (; ai < blength; ai++) {
        c = new Array;
        for (; bi < alength; bi++) {
            if (ai == 0) {
                c[bi] = bi;
            }
            if (bi == 0 && ai != 0) {
                c[0] = ai;
            } else if (ai != 0) {
                c[bi] = 0;
            }
        }
        bi = 0;
        q[ai] = c;
    }
    return q;
}
function min(ma, mb, mc) {
    var min = ma;
    return mb < mc ? (mb < min ? mb : min) : (mc < min ? mc : min);
}
function levenshteinDistance(a, b) {
    var alength = a.length, blength = b.length, i = 1, j = 1, cost;
    var q = getResArray(a, b);
    for (; i <= alength; i++) {
        for (; j <= blength; j++) {
            if (a.charAt(i - 1) == b.charAt(j - 1)) {
                cost = 0;
            }
            else {
                cost = 1;
            }
            q[j][i] = min(q[j - 1][i] + 1, q[j][i - 1] + 1, q[j - 1][i - 1] + cost);
        }
        j = 1;
    }
    return q[blength][alength];
}
// console.log(levenshteinDistance("sdff", "sdf"));                                                

module.exports = levenshteinDistance
