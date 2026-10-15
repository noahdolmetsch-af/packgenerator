// A fictional camt.054 credit notification (Swiss style, namespace prefix-free) for the Rechnungen
// tests: one payment with a QR reference, one TWINT payment naming the invoice in the message, one
// payment without reference (amount only), one collective entry with two payments, one debit.
// Names and amounts are made up; the IBAN is the public sample QR-IBAN of the Swiss standard.
import { qrReference } from '../../src/lib/pay/qrbill.js';

const tx = ({ amt, ref = '', ustrd = '', from = '' }) => `
        <TxDtls>
          <AmtDtls><TxAmt><Amt Ccy="CHF">${amt}</Amt></TxAmt></AmtDtls>
          ${from ? `<RltdPties><Dbtr><Pty><Nm>${from}</Nm></Pty></Dbtr></RltdPties>` : ''}
          <RmtInf>${ref ? `<Strd><CdtrRefInf><Tp><CdOrPrtry><Prtry>QRR</Prtry></CdOrPrtry></Tp><Ref>${ref}</Ref></CdtrRefInf></Strd>` : ''}${ustrd ? `<Ustrd>${ustrd}</Ustrd>` : ''}</RmtInf>
        </TxDtls>`;
const ntry = (amt, ind, txs, day = '2026-10-13') => `
    <Ntry>
      <Amt Ccy="CHF">${amt}</Amt>
      <CdtDbtInd>${ind}</CdtDbtInd>
      <Sts><Cd>BOOK</Cd></Sts>
      <BookgDt><Dt>${day}</Dt></BookgDt>
      <ValDt><Dt>${day}</Dt></ValDt>
      <NtryDtls>${txs.join('')}
      </NtryDtls>
    </Ntry>`;

/** seq numbers of the invoices whose payments are in the file: R-0001 by reference, R-0002 by TWINT text. */
export function camt054() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.054.001.08">
  <BkToCstmrDbtCdtNtfctn>
    <GrpHdr><MsgId>TEST-0001</MsgId><CreDtTm>2026-10-13T20:00:00</CreDtTm></GrpHdr>
    <Ntfctn>
      <Acct><Id><IBAN>CH4431999123000889012</IBAN></Id></Acct>${ntry('80.00', 'CRDT', [tx({ amt: '80.00', ref: qrReference('R-0001'), from: 'Mia Beispiel' })])}${ntry('5.00', 'CRDT', [tx({ amt: '5.00', ustrd: 'TWINT von Leo M. Mitteilung: r-0002', from: 'Leo Muster' })])}${ntry('120.00', 'CRDT', [tx({ amt: '80.00', ustrd: 'Danke!', from: 'Noa Beispiel' }), tx({ amt: '40.00', ustrd: 'Geburtstag', from: 'Sara Test' })])}${ntry('12.50', 'DBIT', [tx({ amt: '12.50', ustrd: 'Kaffee' })])}
    </Ntfctn>
  </BkToCstmrDbtCdtNtfctn>
</Document>`;
}
