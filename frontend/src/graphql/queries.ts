import { gql } from '@apollo/client';

export const GET_ROOMS = gql`
  query GetRooms {
    rooms {
      id
      name
    }
  }
`;

export const GET_DAILY_SUMMARY = gql`
  query GetDailySummary($roomId: UUID!, $date: LocalDate!) {
    dailySummary(roomId: $roomId, date: $date) {
      roomId
      date
      energy {
        totalKwh
        peakHourlyKwh
        averageHourlyKwh
      }
      airQuality {
        averageCo2
        minCo2
        maxCo2
        averagePm25
        minPm25
        maxPm25
        averageHumidity
        minHumidity
        maxHumidity
      }
      motion {
        totalEvents
        activeHours
      }
    }
  }
`;

export const GET_TELEMETRY_RECORDS = gql`
  query GetTelemetryRecords(
    $roomId: UUID!
    $startTime: DateTime!
    $endTime: DateTime!
    $sensorType: SensorType!
  ) {
    telemetryRecords(
      roomId: $roomId
      where: { 
        capturedAt: { gte: $startTime, lte: $endTime }
        type: { eq: $sensorType }
      }
      order: { capturedAt: ASC }
    ) {
      id
      capturedAt
      type
      energy
      co2
      pm25
      humidity
      motionDetected
    }
  }
`;

export const GET_ENERGY_DATA = gql`
  query GetEnergyData(
    $roomId: UUID!
    $startTime: DateTime!
    $endTime: DateTime!
    $useAggregated: Boolean!
    $useDailyAggregated: Boolean!
  ) {
    telemetryRecords(
      roomId: $roomId
      where: { 
        capturedAt: { gte: $startTime, lte: $endTime }
        type: { eq: ENERGY }
      }
      order: { capturedAt: ASC }
    ) @skip(if: $useAggregated) {
      id
      capturedAt
      energy
    }
    
    hourlyAggregates(
      roomId: $roomId
      where: { 
        hourBucket: { gte: $startTime, lte: $endTime }
        type: { eq: ENERGY }
      }
      order: { hourBucket: ASC }
    ) @include(if: $useAggregated) @skip(if: $useDailyAggregated) {
      id
      hourBucket
      totalEnergy
    }

    dailyAggregates(
      roomId: $roomId
      startTime: $startTime
      endTime: $endTime
      type: ENERGY
    ) @include(if: $useDailyAggregated) {
      dayBucket
      totalEnergy
    }
  }
`;

export const GET_AIR_QUALITY_DATA = gql`
  query GetAirQualityData(
    $roomId: UUID!
    $startTime: DateTime!
    $endTime: DateTime!
    $useAggregated: Boolean!
    $useDailyAggregated: Boolean!
  ) {
    telemetryRecords(
      roomId: $roomId
      where: { 
        capturedAt: { gte: $startTime, lte: $endTime }
        type: { eq: AIR_QUALITY }
      }
      order: { capturedAt: ASC }
    ) @skip(if: $useAggregated) {
      id
      capturedAt
      co2
      pm25
      humidity
    }
    
    hourlyAggregates(
      roomId: $roomId
      where: { 
        hourBucket: { gte: $startTime, lte: $endTime }
        type: { eq: AIR_QUALITY }
      }
      order: { hourBucket: ASC }
    ) @include(if: $useAggregated) @skip(if: $useDailyAggregated) {
      id
      hourBucket
      avgCo2
      avgPm25
      avgHumidity
    }

    dailyAggregates(
      roomId: $roomId
      startTime: $startTime
      endTime: $endTime
      type: AIR_QUALITY
    ) @include(if: $useDailyAggregated) {
      dayBucket
      avgCo2
      avgPm25
      avgHumidity
    }
  }
`;

export const GET_MOTION_DATA = gql`
  query GetMotionData(
    $roomId: UUID!
    $startTime: DateTime!
    $endTime: DateTime!
    $useAggregated: Boolean!
    $useDailyAggregated: Boolean!
  ) {
    telemetryRecords(
      roomId: $roomId
      where: { 
        capturedAt: { gte: $startTime, lte: $endTime }
        type: { eq: MOTION }
      }
      order: { capturedAt: ASC }
    ) @skip(if: $useAggregated) {
      id
      capturedAt
      motionDetected
    }
    
    hourlyAggregates(
      roomId: $roomId
      where: { 
        hourBucket: { gte: $startTime, lte: $endTime }
        type: { eq: MOTION }
      }
      order: { hourBucket: ASC }
    ) @include(if: $useAggregated) @skip(if: $useDailyAggregated) {
      id
      hourBucket
      motionCount
    }

    dailyAggregates(
      roomId: $roomId
      startTime: $startTime
      endTime: $endTime
      type: MOTION
    ) @include(if: $useDailyAggregated) {
      dayBucket
      motionCount
    }
  }
`;