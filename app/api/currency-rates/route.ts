import { NextRequest, NextResponse } from "next/server";

const PROXY_URL = "https://prx.darkube.app/proxy";

interface IceApiCurrency {
    id: number;
    slug: string;
    name: string;
    sell_price: string;
    buy_price: string;
    date: string;
}

interface DastyarApiItem {
    key: string;
    price: string;
    priceFloat: string;
    change: string;
    title: string;
    enTitle: string;
    category: string;
    currency: string;
    image: string;
    link: string;
    icon: string;
    sort_order: number;
}

interface CurrencyRatesResponse {
    talar1: number | null;
    talar2: number | null;
    azad: number | null;
}

async function proxyGet(url: string) {
    return fetch(PROXY_URL + "?url=" + encodeURIComponent(url));
}

export async function GET(request: NextRequest) {
    try {
        const rates: CurrencyRatesResponse = {
            talar1: null,
            talar2: null,
            azad: null,
        };

        // Fetch تالار اول (market 2)
        try {
            const res1 = await proxyGet(
                "https://api.ice.ir/api/v1/markets/2/currencies/history/latest/?lang=fa"
            );
            if (res1.ok) {
                const data1: IceApiCurrency[] = await res1.json();
                const usd1 = data1.find((item) => item.slug === "USD");
                if (usd1) {
                    rates.talar1 = parseInt(usd1.sell_price);
                }
            }
        } catch (err) {
            console.error("Error fetching talar1:", err);
        }

        // Fetch تالار دوم (market 1)
        try {
            const res2 = await proxyGet(
                "https://api.ice.ir/api/v1/markets/1/currencies/history/latest/?lang=fa"
            );
            if (res2.ok) {
                const data2: IceApiCurrency[] = await res2.json();
                const usd2 = data2.find((item) => item.slug === "USD");
                if (usd2) {
                    rates.talar2 = parseInt(usd2.sell_price);
                }
            }
        } catch (err) {
            console.error("Error fetching talar2:", err);
        }

        // Fetch بازار آزاد
        try {
            const res3 = await proxyGet(
                "https://api.dastyar.io/express/financial-item"
            );
            if (res3.ok) {
                const data3: DastyarApiItem[] = await res3.json();
                const usd3 = data3.find((item) => item.key === "usd");
                if (usd3) {
                    // Dastyar returns price in Toman, multiply by 10 to get Rial
                    rates.azad = parseInt(usd3.price) * 10;
                }
            }
        } catch (err) {
            console.error("Error fetching azad:", err);
        }

        return NextResponse.json({ data: rates });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : "یک خطای ناشناخته رخ داد.",
            },
            { status: 500 }
        );
    }
}
