import { NextRequest, NextResponse } from "next/server";

const jalaliToGregorian = (jalaliDate: string): string => {
  const parts = jalaliDate.split("/").map((part) => parseInt(part, 10));
  if (parts.length !== 3 || parts.some(isNaN)) {
    console.error(
      `Invalid Jalali date format: ${jalaliDate}. Expected YYYY/MM/DD.`
    );
    const today = new Date();
    return `${String(today.getMonth() + 1).padStart(2, "0")}/${String(
      today.getDate()
    ).padStart(2, "0")}/${today.getFullYear()}`;
  }
  const [jy, jm, jd] = parts;

  var g_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var j_days_in_month = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

  var j_year = jy - 979;
  var j_month = jm - 1;
  var j_day = jd - 1;

  var j_day_no =
    365 * j_year +
    Math.floor(j_year / 33) * 8 +
    Math.floor(((j_year % 33) + 3) / 4);
  for (var i = 0; i < j_month; ++i) {
    j_day_no += j_days_in_month[i];
  }

  j_day_no += j_day;

  var g_day_no = j_day_no + 79;

  var gy = 1600 + 400 * Math.floor(g_day_no / 146097);
  g_day_no = g_day_no % 146097;

  var leap = true;
  if (g_day_no >= 36525) {
    g_day_no--;
    gy += 100 * Math.floor(g_day_no / 36524);
    g_day_no = g_day_no % 36524;
    if (g_day_no >= 365) {
      g_day_no++;
    } else {
      leap = false;
    }
  }

  gy += 4 * Math.floor(g_day_no / 1461);
  g_day_no %= 1461;

  if (g_day_no >= 366) {
    leap = false;
    g_day_no--;
    gy += Math.floor(g_day_no / 365);
    g_day_no = g_day_no % 365;
  }

  for (
    var i = 0;
    g_day_no >= g_days_in_month[i] + (i === 1 && leap ? 1 : 0);
    i++
  ) {
    g_day_no -= g_days_in_month[i] + (i === 1 && leap ? 1 : 0);
  }
  var gm = i + 1;
  var gd = g_day_no + 1;

  return `${String(gm).padStart(2, "0")}/${String(gd).padStart(2, "0")}/${gy}`;
};

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
    const response = await fetch(ORIGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(originalPayload),
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
