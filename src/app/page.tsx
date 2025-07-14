'use client';

import React, { useState } from 'react';
import Select from 'react-select';
import * as XLSX from 'xlsx';

interface WebOption {
  value: string;
  label: string;
}

interface ParsedExcelRow {
  id?: string;
  ssku?: string;
  model?: string;
  [key: string]: unknown;
}

type CrawlResult = {
  id?: string;
  ssku?: string;
  model?: string;
  status: 'processing' | 'done' | 'error';
  result: unknown; // 👈 thay vì any
};

const websiteOptions: WebOption[] = [
  { value: 'hafele', label: 'Hafele - https://www.hafele.com.vn/' },
  { value: 'bosch', label: 'Bosch - https://vn.bosch-pt.com/' },
  { value: 'sino', label: 'Sino - https://sino.com.vn/' },
];

export default function CrawlPage() {
  const [selectedWebsite, setSelectedWebsite] = useState<WebOption | null>(null);
  const [fileData, setFileData] = useState<ParsedExcelRow[]>([]);
  const [results, setResults] = useState<CrawlResult[]>([]);
  const [isCrawling, setIsCrawling] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<ParsedExcelRow>(worksheet);
      setFileData(jsonData);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCrawlData = async () => {
    if (!selectedWebsite) {
      alert('Vui lòng chọn website');
      return;
    }
    if (fileData.length === 0) {
      alert('Vui lòng chọn file Excel');
      return;
    }

    setIsCrawling(true);
    setProgress(0);
    const total = fileData.length;

    const tempResults: CrawlResult[] = fileData.map(row => ({
      id: String(row.id || row.ID || row.Id || ''),
      ssku: String(row.ssku || row['Mã SP'] || ''),
      model: String(row.model || row.Model || row.MODEL || row['Tên Model'] || ''),
      status: 'processing',
      result: null,
    }));

    setResults(tempResults);

    for (let i = 0; i < tempResults.length; i++) {
      const { model } = tempResults[i];
      if (!model) continue;

      try {
        const res = await fetch('/api/crawl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            website: selectedWebsite.value,
            model,
          }),
        });

        const json = await res.json();

        tempResults[i] = {
          ...tempResults[i],
          status: 'done',
          result: json,
        };
      } catch{
        tempResults[i] = {
          ...tempResults[i],
          status: 'error',
          result: '❌ Lỗi khi crawl',
        };
      }

      setResults([...tempResults]);
      setProgress(Math.round(((i + 1) / total) * 100));
    }

    setIsCrawling(false);
  };

  const exportToExcel = () => {
    if (results.length === 0) return;

    const dataToExport = results.map(({ id, ssku, model, status, result }) => ({
      ID: id,
      'Mã SP': ssku,
      Model: model,
      TrạngThái: status,
      KếtQuả: typeof result === 'object' ? JSON.stringify(result) : String(result),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CrawlResults');

    const filename = `crawl-results-${Date.now()}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Crawl Data từ File Excel</h1>

      <div className="mb-4">
        <label className="block font-semibold mb-2">Chọn Website</label>
        <Select
          options={websiteOptions}
          value={selectedWebsite}
          onChange={setSelectedWebsite}
          placeholder="Chọn website"
          isClearable
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-2">Upload File Excel</label>
        <input
          type="file"
          accept=".xlsx"
          onChange={handleFileUpload}
          className="block w-full border border-gray-300 p-2 rounded"
        />
      </div>

      <button
        onClick={handleCrawlData}
        disabled={isCrawling}
        className="bg-blue-600 text-white font-semibold py-2 px-6 rounded hover:bg-blue-700 transition"
      >
        {isCrawling ? 'Đang crawl...' : 'Crawl Data'}
      </button>

      {isCrawling && (
        <div className="mt-4">
          <div className="h-4 bg-gray-200 rounded">
            <div
              className="h-4 bg-blue-600 rounded transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm mt-1">{progress}%</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold mb-2">Kết quả Crawl:</h2>
          <ul className="space-y-2 text-sm mb-4">
            {results.map((item, index) => (
              <li
                key={index}
                className="bg-gray-100 p-2 rounded border border-gray-300 flex justify-between items-center"
              >
                <span>{item.model}</span>
                <span>
                  {item.status === 'processing' && '⏳ Đang xử lý...'}
                  {item.status === 'done' && '✅ Hoàn thành'}
                  {item.status === 'error' && '❌ Lỗi'}
                </span>
              </li>
            ))}
          </ul>

          <button
            onClick={exportToExcel}
            className="bg-green-600 text-white font-semibold py-2 px-6 rounded hover:bg-green-700 transition"
          >
            📥 Xuất Excel kết quả
          </button>
        </div>
      )}
    </div>
  );
}
