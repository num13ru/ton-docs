import React, {
  ChangeEvent,
  KeyboardEvent,
  HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef
} from 'react';
import styles from './SearchField.module.css';
import Markdown from "markdown-to-jsx";

type DataKey<Key> = {
  key: Key;
  name: string;
  isGrouped?: boolean;
}

type Props<DataItem> = {
  /**
   * An array of entities that will be filtered during the search
   * */
  data: DataItem[];
  /**
   * Property that determines a key that will be used for searching
   * */
  searchBy: keyof DataItem;
  /**
   * Decides which keys will be shown in the results
   * */
  showKeys: DataKey<keyof DataItem>[];
} & HTMLAttributes<HTMLInputElement>

export const SearchField = <T extends Record<string, string>>({ data, searchBy, showKeys, ...props }: Props<T>) => {
  const timeout = useRef<NodeJS.Timeout | null>(null);

  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState(inputValue);
  const [filteredData, setFilteredData] = useState<T[]>([]);

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  }, [])

  const handleKeyUp = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, 500)

    return () => {
      clearTimeout(timeout);
    }
  }, [inputValue])

  useEffect(() => {
    setFilteredData(data.filter((item) => String(JSON.stringify(Object.values(item))).toLowerCase().includes(debouncedValue?.toLowerCase())))
  }, [data, debouncedValue, searchBy])

  useEffect(() => () => {
    clearTimeout(timeout.current);
  }, [timeout.current])

  const groupedKeys = useMemo(() => showKeys.filter((key) => key.isGrouped), [showKeys]);
  const separateKeys = useMemo(() => showKeys.filter((key) => !key.isGrouped), [showKeys])

  return (
    <>
      <input
        className={styles.searchField}
        onChange={handleChange}
        onKeyUp={handleKeyUp}
        value={inputValue}
        type="text"
        {...props}
      />

      <table>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Opcode</th>
            <th style={{ textAlign: "left" }}>Fift syntax</th>
            <th style={{ textAlign: "left" }}>Stack</th>
            <th style={{ textAlign: "left" }}>Gas</th>
            <th style={{ textAlign: "left" }}>Description</th>
          </tr>
        </thead>

        <tbody>
          {debouncedValue.length === 0 ? (
            <tr>
              <td colSpan={groupedKeys.length + separateKeys.length}>
                Please enter a search query
              </td>
            </tr>
          ) : filteredData.length === 0 ? (
            <tr>
              <td colSpan={groupedKeys.length + separateKeys.length}>
                No results found
              </td>
            </tr>
          ) : (
            filteredData.map((item, index) => (
              <tr key={index}>
                {groupedKeys.map((keyEntity) => (
                  <td key={keyEntity.name}>
                    {item[keyEntity.key] && <code>{item[keyEntity.key]}</code>}
                  </td>
                ))}
                {separateKeys.map((keyEntity) => (
                  <td key={keyEntity.name}>
                    {item[keyEntity.key] && (<Markdown>{item[keyEntity.key]}</Markdown>)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

    </>
  )
}
