export interface GlobalPriceMapping {
    slug: string;
    globalName: string;
    localLabel: string;
    sourceUrl: string;
}

export const GLOBAL_PRICE_MAPPINGS: GlobalPriceMapping[] = [
    {
        slug: "rebar",
        globalName: "Rebar",
        localLabel: "میلگرد",
        sourceUrl: "https://www.metal.com/Finished-Steel/201703140002"
    },
    {
        slug: "hot-rolled-coils",
        globalName: "Hot Rolled Coils",
        localLabel: "ورق گرم",
        sourceUrl: "https://www.metal.com/Finished-Steel/201703140001"
    },
    {
        slug: "cold-rolled-coils",
        globalName: "Cold-Rolled Coils",
        localLabel: "ورق سرد",
        sourceUrl: "https://www.metal.com/Finished-Steel/201703140003"
    },
    {
        slug: "galvanized",
        globalName: "Galvanized",
        localLabel: "ورق گالوانیزه",
        sourceUrl: "https://www.metal.com/Finished-Steel/201703140006"
    },
    {
        slug: "slab",
        globalName: "Slab",
        localLabel: "تختال",
        sourceUrl: "https://www.metal.com/Finished-Steel/202511040003"
    },
    {
        slug: "billet",
        globalName: "Billet",
        localLabel: "شمش",
        sourceUrl: "https://www.metal.com/Finished-Steel/202504270001"
    }
];
