import React from 'react';
import { Icon, Tip, __ } from 'erxes-ui';
import Select from 'react-select-plus';
import dayjs from 'dayjs';
import { FlexRow, ImportColumnRow } from 'modules/importExport/styles';

type Props = {
  columns: any[];
  column: string;
  fields: any[];
  columnWithChosenField: any;
  onChangeColumn: (column, value, contentType) => void;
  contentType: string;
};

class Row extends React.Component<Props, {}> {
  renderSampleDatas = () => {
    const { column, columns } = this.props;

    const sampleDatas = columns[column];

    return sampleDatas.map(sample => {
      return <p key={Math.random()}>{`${sample}, `} &nbsp;</p>;
    });
  };

  onChange = ({ value }) => {
    const { column, contentType } = this.props;

    this.props.onChangeColumn(column, value, contentType);
  };

  renderMatch = () => {
    const {
      column,
      columns,
      columnWithChosenField,
      fields,
      contentType
    } = this.props;

    if (columnWithChosenField[contentType]) {
      const chosenColumn = columnWithChosenField[contentType][column];

      let matched = true;

      if (!chosenColumn) {
        return <Icon icon="checked-1" color="green" />;
      }

      const sampleDatas = columns[column];

      const chosenField = fields.find(
        field => field.value === chosenColumn.value
      );

      for (const sample of sampleDatas) {
        if (chosenField.type === 'date') {
          if (!dayjs(sample).isValid()) {
            matched = false;
          }
        }

        if (chosenField.label && chosenField.label.includes('Email')) {
          const re = /\S+@\S+\.\S+/;

          if (!re.test(sample)) {
            matched = false;
          }
        }
      }

      if (matched) {
        return <Icon icon="checked-1" color="green" />;
      }

      return (
        <Tip text="Not matched">
          <Icon icon="exclamation-triangle" color="orange" />
        </Tip>
      );
    }

    return <Icon icon="checked-1" color="green" />;
  };

  render() {
    const { fields, columnWithChosenField, column, contentType } = this.props;

    const renderValue = () => {
      const value = columnWithChosenField[contentType];

      if (!value) {
        return '';
      }

      if (value) {
        return value[column] ? value[column].value : '';
      }

      return '';
    };

    return (
      <ImportColumnRow>
        <td>{this.props.column}</td>
        <td>
          <FlexRow>{this.renderSampleDatas()}</FlexRow>
        </td>
        <td>
          <FlexRow>
            <Select
              placeholder={__('Choose')}
              options={fields}
              onChange={this.onChange}
              clearable={false}
              value={renderValue()}
            />
            {this.renderMatch()}
          </FlexRow>
        </td>
      </ImportColumnRow>
    );
  }
}

export default Row;
