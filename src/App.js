import React, { useState, useEffect } from 'react';
import './App.css';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}
function getDatesInRange(intervalType, date) {
  const start = {
    yearly: startOfYear(date),
    monthly: startOfMonth(date),
    weekly: startOfWeek(date),
  }[intervalType];

  const end = {
    yearly: endOfYear(date),
    monthly: endOfMonth(date),
    weekly: endOfWeek(date),
  }[intervalType];

  return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
}
function exportRecords(items, itemName, intervalType) {
  const item = items.find(i => i.name === itemName);
  if (!item) {
    alert('找不到指定的项目。');
    return;
  }

  const now = new Date();
  const datesInRange = getDatesInRange(intervalType, now);
  let content = `项目名称: ${item.name}\n打卡记录 (${intervalType}):\n`;

  Object.keys(item.records).forEach(date => {
    if (datesInRange.includes(date)) {
      content += `${date}:\n`;
      item.records[date].forEach((punchTime, index) => {
        content += `    ${index + 1}. ${format(punchTime, 'HH:mm:ss')}\n`;
      });
    }
  });

  // 导出到文本文件
  console.log(content);
  const filename = `${item.name}-打卡记录-${format(now, 'yyyy-MM-dd')}-${intervalType}.txt`;
  download(filename, content);
}


const App = () => {
  const [items, setItems] = useState(JSON.parse(localStorage.getItem('punchItems')) || []);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemName, setItemName] = useState('');

  useEffect(() => {
    localStorage.setItem('punchItems', JSON.stringify(items));
  }, [items]);

  const addNewItem = () => {
    if (itemName.trim() === '') {
      alert('Please enter an item name.');
      return;
    }
    const newItem = {
      name: itemName.trim(),
      records: {},
    };
    setItems([...items, newItem]);
    setItemName('');
  };

  const deleteItem = (itemName) => {
    // 确认是否真的要删除
    if (window.confirm(`确定要删除项目 "${itemName}" 及其所有打卡记录吗？`)) {
      const updatedItems = items.filter(item => item.name !== itemName);
      setItems(updatedItems);
      // 如果删除的是当前选中的项目，则清空选中的项目
      if (selectedItem && selectedItem.name === itemName) {
        setSelectedItem(null);
      }
    }
  };  

  const punch = () => {
    if (selectedItem) {
      const updatedItems = items.map((item) => {
        if (item.name === selectedItem.name) {
          const records = {...item.records};
          const punches = records[selectedDate] || [];
          punches.push(new Date()); // 添加当前时间的打卡记录
          records[selectedDate] = punches; // 更新特定日期的打卡记录
          return { ...item, records };
        }
        return item;
      });
      setItems(updatedItems); // 更新状态
    } else {
      alert('请选择一个项目。');
    }
  };

  const cancelPunch = (itemName, date) => {
    const updatedItems = items.map((item) => {
      if (item.name === itemName) {
        const records = { ...item.records };
        if (records[date] && records[date].length > 0) {
          // 删除最后一次打卡记录
          records[date].pop();
          if (records[date].length === 0) {
            delete records[date];  // 如果当天没有其他打卡记录，则删除该日期
          }
        }
        return { ...item, records };
      }
      return item;
    });
    setItems(updatedItems);
  };  

  return (
    <div>
      <h1>Punch Card App</h1>
      <div className='item-container'>
        <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} />
        <button onClick={addNewItem}>添加项目</button>
      </div>
      <div>
        <ul>
          {items.map((item, index) => (
            <li
              key={index}
              className={selectedItem && selectedItem.name === item.name ? 'active' : ''}
            >
              <div className='item-container'>
                <span className='span-container' onClick={() => setSelectedItem(item)}>{item.name}</span>
                <button onClick={() => deleteItem(item.name)} className="button delete-button">删除</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <hr />
      {selectedItem && (
        <div>
          <h2>{selectedItem.name}</h2>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          <button onClick={() => punch(selectedItem)}>打卡</button>
          <button onClick={() => cancelPunch(selectedItem.name, selectedDate)} className="button cancel-button">取消打卡</button>
          <div>
            <button onClick={() => exportRecords(items,selectedItem.name,'weekly')}>Export Weekly</button>
            <button onClick={() => exportRecords(items,selectedItem.name,'monthly')}>Export Monthly</button>
            <button onClick={() => exportRecords(items,selectedItem.name,'yearly')}>Export Yearly</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
