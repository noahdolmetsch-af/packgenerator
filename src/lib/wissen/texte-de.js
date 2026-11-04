// The German of the «Good to know» tips (src/lib/i18n/de/wissen-*.js), loaded with the card by load.js, not at the start.
const files = import.meta.glob('../i18n/de/wissen-*.js', { eager: true, import: 'default' });
export default Object.assign({}, ...Object.values(files));
