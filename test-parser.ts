import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
    ignoreAttributes: false,
    ignoreDeclaration: true,
    attributeNamePrefix: '_',
    trimValues: true,
    parseTagValue: true,
    parseAttributeValue: false,
    cdataPropName: '__cdata',
});

const xml = `<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
<combination>
<id><![CDATA[23]]></id>
<id_product><![CDATA[10]]></id_product>
<price><![CDATA[15.5]]></price>
</combination>
</prestashop>`;

console.log(JSON.stringify(parser.parse(xml), null, 2));
