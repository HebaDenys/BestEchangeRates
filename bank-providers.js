// Institution inventory, not a list of working feeds or verified local branches.
// BCP register checked 2026-10-20; Banco do Brasil has no verified local website here.
export const BANK_REGISTER={url:'https://www.bcp.gov.py/documents/20117/319021/20260320%2BLISTADO%2BDE%2BENTIDADES%2BSUPERVISADAS.pdf/72d9cd46-9945-f2d2-b40a-d2d5fb34345d?t=1780412378396',date:'2026-03-20',label:'Bancos supervisados por el BCP'};
const entries=[
 ['citibank','Citibank','https://www.citibank.com/icg/sa/latam/paraguay/markets/forex-trading.html'],
 ['bancodobrasil','Banco do Brasil',null],
 ['bna','Banco de la Nación Argentina Paraguay','https://www.bna.com.py/'],
 ['itau','Itaú Paraguay','https://www.itau.com.py/'],
 ['sudameris','Sudameris','https://www.sudameris.com.py/'],
 ['gnb','GNB Paraguay','https://www.bancognb.com.py/public/tesoreria-mercados.jsp'],
 ['basa','Banco Basa','https://www.bancobasa.com.py/'],
 ['continental','Banco Continental','https://www.bancontinental.com.py/'],
 ['familiar','Banco Familiar','https://familiar.com.py/cambios'],
 ['atlas','Banco Atlas','https://www.bancoatlas.com.py/'],
 ['bancop','Bancop','https://www.bancop.com.py/servicio_pymes/52/cambios'],
 ['interfisa','Interfisa Banco','https://www.interfisa.com.py/'],
 ['solar','Solar Banco','https://www.solar.com.py/'],
 ['ueno','Ueno Bank','https://www.ueno.com.py/cambio-de-moneda/'],
 ['zeta','Zeta Banco','https://www.zbanco.com.py/site?page=cotizaciones'],
 ['bnf','Banco Nacional de Fomento','https://www.bnf.gov.py/'],
];
export const BANK_PROVIDERS=entries.map(([id,name,officialWebsite])=>({id,name,url:officialWebsite||BANK_REGISTER.url,officialWebsite,registerUrl:BANK_REGISTER.url,cities:[],institutionType:'bank',geographicScope:'bank_publication_unspecified',feedStatus:['atlas','ueno','familiar','solar'].includes(id)?'public_adapter':'directory_only'}));
