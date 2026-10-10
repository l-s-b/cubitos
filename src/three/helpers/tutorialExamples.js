const DEMONSTRATIONS = Object.freeze([
    Object.freeze({
        line: Object.freeze(['ACB', 'BCB', 'CCB']),
        center: 'BCB',
        screenAxis: 'x',
    }),
    Object.freeze({
        line: Object.freeze(['ACB', 'ABB', 'AAB']),
        center: 'ABB',
        screenAxis: 'y',
    }),
    Object.freeze({
        line: Object.freeze(['ACB', 'BBC', 'CAB']),
        center: 'BBC',
        screenAxis: 'x',
        rotationDirection: 'right',
    }),
    Object.freeze({
        line: Object.freeze(['ACB', 'BCA', 'CCB']),
        center: 'BCB',
        middle: 'BCA',
        screenAxis: 'x',
    }),
]);

export default DEMONSTRATIONS;
