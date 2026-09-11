import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, timeout: 20000 });

export const endpoints = {
  overview:            () => api.get("/overview"),
  dataSchema:          () => api.get("/data/schema"),
  dataRows:            (params) => api.get("/data/rows", { params }),
  edaActivityDist:     () => api.get("/eda/activity-distribution"),
  edaSubjectDist:      () => api.get("/eda/subject-distribution"),
  edaDeviceDist:       () => api.get("/eda/device-distribution"),
  edaAverageMotion:    () => api.get("/eda/average-motion"),
  edaCorrelation:      () => api.get("/eda/correlation"),
  edaSensorSignal:     (params) => api.get("/eda/sensor-signal", { params }),
  edaScatter:          (params) => api.get("/eda/scatter", { params }),
  edaTimeSeries:       (params) => api.get("/eda/time-series", { params }),
  edaBoxPlot:          (metric) => api.get("/eda/box-plot", { params: { metric } }),
  edaHistogram:        (feature, bins = 40) => api.get("/eda/histogram", { params: { feature, bins } }),
  modelInfo:           () => api.get("/model/info"),
  modelMetrics:        () => api.get("/model/metrics"),
  modelFeatureImp:     () => api.get("/model/feature-importance"),
  predict:             (payload) => api.post("/predict", payload),
  predictSample:       (activity) => api.get("/predict/sample", { params: activity ? { activity } : {} }),
  predictCsv:          (formData) => api.post("/predict/csv", formData, { headers: { "Content-Type": "multipart/form-data" } }),
};
