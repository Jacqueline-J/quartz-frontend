import Head from "next/head";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import useSWR from "swr";
import dynamic from "next/dynamic";

import { Button } from "@openclimatefix/nowcasting-ui";

import Layout from "../components/layout";

const fetcher = (input: RequestInfo, init: RequestInit) =>
  fetch(input, init).then((res) => res.json());

const API_PREFIX_LOCAL = "/api";
const API_PREFIX_REMOTE = "https://api-dev.nowcasting.io/v0";
const IS_LOCAL_REQ = true;
const API_PREFIX = IS_LOCAL_REQ ? API_PREFIX_LOCAL : API_PREFIX_REMOTE;

const DynamicSolarMapWithNoSSR = dynamic(
  () => import("../components/solar-map"),
  { ssr: false }
);

export default function Home() {
  const { data: forecastData, error: forecastError } = useSWR(
    `${API_PREFIX}/forecasts/GB/pv/gsp`,
    fetcher
  );
  const { data: gspregionData, error: gspregionError } = useSWR(
    `${API_PREFIX}/forecasts/GB/gsp-regions`,
    fetcher
  );

  if (forecastError || gspregionError) {
    console.log(forecastError || gspregionError);
    return <div>Failed to load</div>;
  }

  return (
    <Layout>
      <div className="container min-h-screen">
        <Head>
          <title>Nowcasting App</title>
        </Head>

        <main className="pt-12">
          <h1 className="mb-6 text-3xl font-bold leading-tight text-gray-900">
            API Response
          </h1>
          <p className="mb-2">
            Fetching data{" "}
            <strong>
              {IS_LOCAL_REQ
                ? "from locally mocked endpoint."
                : "remotely from api-dev.nowcasting.io!"}
            </strong>
          </p>

          <div className="my-6">
            {gspregionData && <DynamicSolarMapWithNoSSR data={gspregionData} />}
          </div>
          {!forecastData ? (
            <p>Loading...</p>
          ) : (
            <pre className="p-2 rounded-md bg-slate-800 text-slate-200">
              <code>{JSON.stringify(forecastData, null, 2)}</code>
            </pre>
          )}

          <button
            type="button"
            onClick={() => {
              throw new Error("Sentry Frontend forecastError");
            }}
          >
            Throw Error
          </button>
          <Button>Hello</Button>
        </main>
      </div>
    </Layout>
  );
}

export const getServerSideProps = withPageAuthRequired();