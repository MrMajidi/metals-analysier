import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromDate, toDate } = body;

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: "fromDate and toDate are required" },
        { status: 400 }
      );
    }

    const ORIGIN_URL =
      "https://www.ime.co.ir/subsystems/ime/services/home/imedata.asmx/GetAmareMoamelatList";

    const PROXY_URL = "https://prx.darkube.app/proxy";
    const originalPayload = {
      Language: 8,
      fari: false,
      GregorianFromDate: fromDate,
      GregorianToDate: toDate,
      MainCat: 1, // Metals and Minerals
      Cat: 1, // Steel
      SubCat: 0,
      Producer: 0,
    };

    // log a curl equivalent here

    console.log(
      `curl -X POST ${ORIGIN_URL} -H "Content-Type: application/json" -d '${JSON.stringify(
        originalPayload
      )}'`
    );
    const response = await fetch(PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: ORIGIN_URL,
        data: originalPayload
      }),
    });

    if (!response.ok) {
      throw new Error(`خطا در ارتباط با سرور: ${response.statusText}`);
    }

    const jsonResponse = await response.json();

    if (jsonResponse.d) {
      const rawData = JSON.parse(jsonResponse.d);
      return NextResponse.json({ data: rawData });
    } else {
      throw new Error("فرمت پاسخ دریافت شده نامعتبر است.");
    }
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
