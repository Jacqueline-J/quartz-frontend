"use client";
import { useGetRegionsQuery } from "@/src/hooks/queries";
import { components } from "@/src/types/schema";
import {
  ChevronLeft,
  ClockIcon,
  HamburgerMenu,
  PowerIcon,
  SolarIcon,
  WindIcon,
} from "./icons/icons";
import { useState } from "react";
import WideCard from "./sidebar-components/card";
import ForecastTimeDisplay from "./sidebar-components/time-label";
import MiniCard from "./sidebar-components/mini-card";
import { DateTime } from "luxon";
import { FC } from "react";
import { get } from "http";

type SidebarProps = {
  title: string;
  solarGenerationData:
    | components["schemas"]["GetHistoricGenerationResponse"]
    | undefined;
  windGenerationData:
    | components["schemas"]["GetHistoricGenerationResponse"]
    | undefined;
  solarForecastData:
    | components["schemas"]["GetForecastGenerationResponse"]
    | undefined;
  windForecastData:
    | components["schemas"]["GetForecastGenerationResponse"]
    | undefined;
};

const Sidebar: React.FC<SidebarProps> = ({
  solarGenerationData,
  windGenerationData,
  solarForecastData,
  windForecastData,
  title,
}) => {
  const convertDatestampToEpoch = (time: string) => {
    const date = new Date(time.slice(0, 16));
    return date.getTime();
  };

  const getNowInTimezone = () => {
    const now = DateTime.now().setZone("ist");
    return DateTime.fromISO(now.toString().slice(0, 16)).set({
      hour: now.minute >= 45 ? now.hour + 1 : now.hour,
      minute: now.minute < 45 ? Math.floor(now.minute / 15) * 15 : 0,
      second: 0,
      millisecond: 0,
    });
  };

  const getNext15MinSlot = () => {
    const now = getNowInTimezone();
    if (now.minute >= 45) {
      return now.plus({ hours: 1 }).set({ minute: 0 });
    } else if (now.minute < 45) {
      return now.set({ minute: Math.floor(now.minute / 15) * 15 + 15 });
    } else {
      return now;
    }
  };

  const getEpochNowInTimezone = () => {
    return getNowInTimezone().toMillis();
  };

  const getEpochNowInTimezonePlus15 = () => {
    return getNext15MinSlot().toMillis();
  };

  // function to get the current time as 00:00 format
  const prettyPrintNowTime = () => {
    return getNowInTimezone().toFormat("HH:mm");
  };

  // function to get the next 15 min slot as 00:00 format
  const prettyPrintNextTime = () => {
    return getNext15MinSlot().toFormat("HH:mm");
  };

  let formattedSidebarData: {
    timestamp: number;
    time?: string;
    solar_forecast?: number;
    wind_forecast?: number;
    solar_generation?: number;
    wind_generation?: number;
  }[] = [];

  if (windForecastData?.values) {
    for (const value of windForecastData?.values) {
      const timestamp = convertDatestampToEpoch(value.Time);
      const existingData = formattedSidebarData?.find(
        (data) => data.timestamp === timestamp
      );
      if (existingData) {
        existingData.wind_forecast = value.PowerKW / 1000;
      } else {
        formattedSidebarData.push({
          timestamp,
          wind_forecast: value.PowerKW / 1000,
        });
      }
    }
  }

  if (solarForecastData?.values) {
    console.log("solarForecastData", solarForecastData);
    for (const value of solarForecastData?.values) {
      const time = value.Time;
      const timestamp = convertDatestampToEpoch(value.Time);
      const existingData = formattedSidebarData?.find(
        (data) => data.timestamp === timestamp
      );
      if (existingData) {
        existingData.solar_forecast = value.PowerKW / 1000;
      } else {
        formattedSidebarData.push({
          timestamp,
          time,
          solar_forecast: value.PowerKW / 1000,
        });
      }
    }
  }

  if (solarGenerationData?.values) {
    for (const value of solarGenerationData?.values) {
      const timestamp = convertDatestampToEpoch(value.Time);
      const existingData = formattedSidebarData?.find(
        (data) => data.timestamp === timestamp
      );
      if (
        existingData &&
        (existingData.solar_forecast || existingData.wind_forecast)
      ) {
        existingData.solar_generation = value.PowerKW / 1000;
      }
    }
  }

  if (windGenerationData?.values) {
    for (const value of windGenerationData?.values) {
      const timestamp = convertDatestampToEpoch(value.Time);
      const existingData = formattedSidebarData?.find(
        (data) => data.timestamp === timestamp
      );
      if (
        existingData &&
        (existingData.solar_forecast || existingData.wind_forecast)
      ) {
        existingData.wind_generation = value.PowerKW / 1000;
      }
    }
  }

  const formattedSideBarData = formattedSidebarData.sort(
    (a, b) => a.timestamp - b.timestamp
  );

  let solarForecastNow = formattedSideBarData.find(
    (data) => data.timestamp === getEpochNowInTimezone()
  )?.solar_forecast;
  solarForecastNow = Number(solarForecastNow) / 1000 || 0;

  let windForecastNow =
    formattedSideBarData.find(
      (data) => data.timestamp === getEpochNowInTimezone()
    )?.wind_forecast || 0;
  windForecastNow = Number(windForecastNow) / 1000 || 0;

  // get the next 15 min slot solar forecast

  let solarForecastNext =
    formattedSideBarData.find(
      (data) => data.timestamp === getEpochNowInTimezonePlus15()
    )?.solar_forecast || 0;
  solarForecastNext = Number(solarForecastNext / 1000) || 0;

  let windForecastNext =
    formattedSideBarData.find(
      (data) => data.timestamp === getEpochNowInTimezonePlus15()
    )?.wind_forecast || 0;
  windForecastNext = Number(windForecastNext / 1000) || 0;

  // let actualPowerGeneration = Number(actualWindGeneration + 0).toFixed(2) || 0;
  const powerForecastNow = Number(windForecastNow + solarForecastNow) || 0;
  const powerForecastNext = Number(windForecastNext + solarForecastNext) || 0;

  let actualWindGeneration = formattedSideBarData.find(
    (data) => data.timestamp === getEpochNowInTimezone()
  )?.wind_generation;
  actualWindGeneration = Number(actualWindGeneration) / 1000 || 0;

  console.log("actualWindGeneration", actualWindGeneration);

  let actualSolarGeneration = formattedSideBarData.find(
    (data) => data.timestamp === getEpochNowInTimezone()
  )?.solar_generation;
  actualSolarGeneration = Number(actualSolarGeneration) / 1000 || 0;

  let actualPowerGeneration =
    Number(actualWindGeneration + actualSolarGeneration) || 0;

  let [expanded, setExpanded] = useState(true);
  function handleClick() {
    setExpanded(!expanded);
  }
  if (expanded) {
    return (
      <div className="flex-0 w-96 justify-center items-center bg-444444">
        <div className="w-full h-full p-4 bg-neutral-700 flex-col justify-start items-start gap-5 inline-flex">
          <div className="justify-start items-start gap-[110px] flex-col">
            <div className="flex justify-between">
              <div className="text-white text-lg font-bold font-sans leading-normal">
                {title}
              </div>
              <button className="w-8 h-8 relative" onClick={handleClick}>
                <ChevronLeft />
              </button>
            </div>

            <div className="self-stretch h-[465px] flex-col justify-start items-start gap-4 flex">
              {/* start card */}
              <WideCard
                icon={<PowerIcon />}
                actualGeneration={actualPowerGeneration.toFixed(2) || "--"}
                currentForecast={powerForecastNow.toFixed(2) || 0}
                nextForecast={powerForecastNext.toFixed(2) || 0}
                energyTag="Power"
                bgTheme="bg-quartz-energy-100"
                textTheme="text-quartz-energy-100"
              />
              {/* end card */}
              <div className="w-[350px] h-px border border-white border-opacity-40"></div>
              <div className="self-stretch h-[39px] justify-start items-start gap-4 inline-flex">
                <ForecastTimeDisplay
                  time={prettyPrintNowTime()}
                  icon={<ClockIcon />}
                  forecastTag="NOW GW"
                />
                <ForecastTimeDisplay
                  time={prettyPrintNextTime()}
                  icon={<ClockIcon />}
                  forecastTag="NEXT GW"
                />
              </div>
              <WideCard
                icon={<WindIcon />}
                actualGeneration={actualWindGeneration.toFixed(2) || "--"}
                currentForecast={windForecastNow.toFixed(2) || 0}
                nextForecast={windForecastNext.toFixed(2) || 0}
                energyTag="Wind"
                textTheme="text-quartz-energy-200"
                bgTheme="bg-quartz-energy-200"
              />
              <div className="w-[350px] h-px border border-white border-opacity-40"></div>
              <WideCard
                icon={<SolarIcon />}
                actualGeneration={actualSolarGeneration.toFixed(2) || "--"}
                currentForecast={solarForecastNow.toFixed(2) || 0}
                nextForecast={solarForecastNext.toFixed(2) || 0}
                energyTag="Solar"
                textTheme="text-quartz-energy-300"
                bgTheme="bg-quartz-energy-300"
              />
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex-0 justify-center items-center bg-444444">
        <div className="w-14 h-full px-2 py-4 bg-neutral-700 flex-col justify-start items-center gap-5 inline-flex">
          <div className="justify-start items-start gap-[110px] inline-flex ">
            <button
              className="w-6 h-6 relative rounded-lg"
              onClick={handleClick}
            >
              <HamburgerMenu />
            </button>
          </div>
          <div className="self-stretch h-[354px] flex-col justify-start items-start gap-4 flex">
            <MiniCard
              icon={<PowerIcon />}
              textTheme={"text-quartz-energy-100"}
              bgTheme={"bg-quartz-energy-100"}
              actualGeneration={actualPowerGeneration.toFixed(1) || "--"}
              nextForecast={powerForecastNext.toFixed(1) || 0}
            />
            <div className="w-full h-px mt-4 border border-white border-opacity-40"></div>
            <MiniCard
              icon={<WindIcon />}
              textTheme={"text-quartz-energy-200"}
              bgTheme={"bg-quartz-energy-200"}
              actualGeneration={actualWindGeneration.toFixed(1) || "--"}
              nextForecast={windForecastNext.toFixed(1) || 0}
            />
            <div className="w-full h-px mt-4 border border-white border-opacity-40"></div>
            <MiniCard
              icon={<SolarIcon />}
              textTheme={"text-quartz-energy-300"}
              bgTheme={"bg-quartz-energy-300"}
              actualGeneration={actualSolarGeneration.toFixed(1) || "--"}
              nextForecast={solarForecastNext.toFixed(1) || 0}
            />
          </div>
        </div>
      </div>
    );
  }
};

export default Sidebar;
