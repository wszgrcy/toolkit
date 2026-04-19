import { expect } from 'chai';
import { jsonParse, markdownParse, yamlParse } from '../index';
import { stringify } from 'yaml';
describe('pase', () => {
  it('json', () => {
    const result = jsonParse(JSON.stringify({ a: 1 }));
    expect(result).deep.eq({ a: 1 });
  });
  it('json2', () => {
    const result = jsonParse(`\`\`\`json
${JSON.stringify({ a: 1 })}
\`\`\``);
    expect(result).deep.eq({ a: 1 });
  });
  it('md', () => {
    const result = markdownParse(`12345`);
    expect(result).deep.eq('12345');
  });
  it('md2', () => {
    const result = markdownParse(`\`\`\`markdown
12345
\`\`\``);
    expect(result).deep.eq('12345');
  });
  it('yaml', () => {
    const result = yamlParse(stringify({ a: 1 }));
    expect(result).deep.eq({ a: 1 });
  });
  it('yaml2', () => {
    const result = yamlParse(`\`\`\`yaml
${stringify({ a: 1 })}
\`\`\``);
    expect(result).deep.eq({ a: 1 });
  });
});
