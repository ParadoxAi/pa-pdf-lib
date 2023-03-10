import PDFDict from 'src/core/objects/PDFDict';
import PDFRef from 'src/core/objects/PDFRef';
import PDFAcroTerminal from 'src/core/acroform/PDFAcroTerminal';
import PDFContext from '../PDFContext';

class PDFAcroSignature extends PDFAcroTerminal {
  static fromDict = (dict: PDFDict, ref: PDFRef) =>
    new PDFAcroSignature(dict, ref);

  static create = (context: PDFContext) => {
    const dict = context.obj({
      FT: 'Sig',
      Kids: [],
    });
    const ref = context.register(dict);
    return new PDFAcroSignature(dict, ref);
  };
}

export default PDFAcroSignature;
