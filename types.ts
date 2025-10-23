
export interface RawDataItem {
  GoodsName: string;
  Symbol: string;
  ProducerName: string;
  ContractType: string;
  MinPrice: number | null;
  Price: number | null;
  MaxPrice: number | null;
  arze: number;
  ArzeBasePrice: number;
  arzeMinPrice: number;
  taghaza: number;
  taghazavoroudi: number;
  taghazaMaxPrice: number;
  Quantity: number;
  TotalPrice: number;
  date: string;
  DeliveryDate: string;
  Warehouse: string;
  ArzehKonandeh: string;
  SettlementDate: string | null;
  Category: string;
  xTalarReportPK: number;
  bArzehRadifTarSarresid: string | null;
  cBrokerSpcName: string;
  ModeDescription: string;
  MethodDescription: string;
  MinPrice1: number | null;
  Price1: number | null;
  Currency: string;
  Unit: string;
  arzehPk: string;
  Talar: string;
  PacketName: string;
  Tasvieh: string;
}

export interface AggregatedData {
  groupName: string;
  totalQuantity: number;
  totalSupply: number;
  totalValue: number;
  averagePrice: number;
}
