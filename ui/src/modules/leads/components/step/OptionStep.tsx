import { COLORS } from 'modules/boards/constants';
import FormControl from 'modules/common/components/form/Control';
import FormGroup from 'modules/common/components/form/Group';
import ControlLabel from 'modules/common/components/form/Label';
import { LeftItem } from 'modules/common/components/step/styles';
import Toggle from 'modules/common/components/Toggle';
import { __ } from 'modules/common/utils';
import { IFormData } from 'modules/forms/types';
import SelectBrand from 'modules/settings/integrations/containers/SelectBrand';
import SelectChannels from 'modules/settings/integrations/containers/SelectChannels';
import { IField } from 'modules/settings/properties/types';
import { ColorPick, ColorPicker, Description } from 'modules/settings/styles';
import React from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import TwitterPicker from 'react-color/lib/Twitter';
import { IBrand } from '../../../settings/brands/types';
import { BackgroundSelector, FlexItem } from './style';

type Props = {
  type: string;
  formData: IFormData;
  color: string;
  theme: string;
  title?: string;
  language?: string;
  isRequireOnce?: boolean;
  onChange: (
    name:
      | 'brand'
      | 'language'
      | 'isRequireOnce'
      | 'channelIds'
      | 'theme'
      | 'color',
    value: any
  ) => void;
  fields?: IField[];
  brand?: IBrand;
  channelIds?: string[];
  onFieldEdit?: () => void;
};

class OptionStep extends React.Component<Props, {}> {
  onChangeFunction = (name: any, value: any) => {
    this.props.onChange(name, value);
  };

  onColorChange = e => {
    this.setState({ color: e.hex, theme: '#000' }, () => {
      this.props.onChange('color', e.hex);
      this.props.onChange('theme', e.hex);
    });
  };

  onChangeTitle = e =>
    this.onChangeFunction('title', (e.currentTarget as HTMLInputElement).value);

  renderThemeColor(value: string) {
    const onClick = () => this.onChangeFunction('theme', value);

    return (
      <BackgroundSelector
        key={value}
        selected={this.props.theme === value}
        onClick={onClick}
      >
        <div style={{ backgroundColor: value }} />
      </BackgroundSelector>
    );
  }

  render() {
    const { language, brand, color, theme, isRequireOnce } = this.props;

    const popoverTop = (
      <Popover id="color-picker">
        <TwitterPicker
          width="266px"
          triangle="hide"
          colors={COLORS}
          color={color}
          onChange={this.onColorChange}
        />
      </Popover>
    );

    const onChange = e =>
      this.onChangeFunction(
        'brand',
        (e.currentTarget as HTMLInputElement).value
      );

    const channelOnChange = (values: string[]) => {
      this.onChangeFunction('channelIds', values);
    };

    const onChangeLanguage = e =>
      this.onChangeFunction(
        'language',
        (e.currentTarget as HTMLInputElement).value
      );

    const onSwitchHandler = e => {
      this.onChangeFunction('isRequireOnce', e.target.checked);
    };

    return (
      <FlexItem>
        <LeftItem>
          <FormGroup>
            <ControlLabel required={true}>Popup Name</ControlLabel>
            <p>{__('Name this popup to differentiate from the rest')}</p>

            <FormControl
              required={true}
              onChange={this.onChangeTitle}
              defaultValue={this.props.title}
              autoFocus={true}
            />
          </FormGroup>
          <FormGroup>
            <SelectBrand
              isRequired={true}
              onChange={onChange}
              defaultValue={brand ? brand._id : ' '}
            />
          </FormGroup>

          <SelectChannels
            defaultValue={this.props.channelIds}
            isRequired={true}
            description="Choose a channel, if you wish to see every new form in your Team Inbox."
            onChange={channelOnChange}
          />
          <FormGroup>
            <ControlLabel>Language</ControlLabel>
            <FormControl
              componentClass="select"
              defaultValue={language}
              id="languageCode"
              onChange={onChangeLanguage}
            >
              <option />
              <option value="mn">Монгол</option>
              <option value="en">English</option>
            </FormControl>
          </FormGroup>

          <FormGroup>
            <ControlLabel>Submit once</ControlLabel>
            <Description>
              Turn on to receive a submission from the visitor only once. Once a
              submission is received, the popup will not show.
            </Description>
            <br />
            <div>
              <Toggle
                checked={isRequireOnce || false}
                onChange={onSwitchHandler}
                icons={{
                  checked: <span>Yes</span>,
                  unchecked: <span>No</span>
                }}
              />
            </div>
          </FormGroup>

          <FormGroup>
            <ControlLabel>Theme color</ControlLabel>
            <Description>Try some of these colors</Description>
            <br />
            <div>
              <OverlayTrigger
                trigger="click"
                rootClose={true}
                placement="bottom-start"
                overlay={popoverTop}
              >
                <ColorPick>
                  <ColorPicker style={{ backgroundColor: theme }} />
                </ColorPick>
              </OverlayTrigger>
            </div>
          </FormGroup>
        </LeftItem>
      </FlexItem>
    );
  }
}

export default OptionStep;
