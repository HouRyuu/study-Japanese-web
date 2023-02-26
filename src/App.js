import './App.css';
import { Component } from 'react';
import {
  Space, Card, Table, Tag, Row, Col, Divider, Input, Select, Button, Tooltip, Popconfirm,
  Drawer, message, Alert
} from 'antd';
import { SearchOutlined, PlusOutlined, FormOutlined, DeleteOutlined, UnorderedListOutlined, SaveOutlined, CloseCircleOutlined } from '@ant-design/icons';
import FetchUtil from "./utils/FetchUtil";

const { Option } = Select;


class App extends Component {
  state = {
    grammarTotal: 1,
    grammarQuery: {
      current: 1,
      pageSize: 5,
      grammar: null
    },
    grammarList: [],
    showDrawer: false,
    curGrammar: {},
    showExample: false,
    exampleList: [],
    editExampleId: 0,
    curExample: {}
  }
  grammarPage(isNew) {
    const { grammarQuery } = this.state;
    if (isNew) {
      grammarQuery.current = 1;
    }
    FetchUtil.post({
      url: '/grammar/page',
      data: grammarQuery,
      success: ({ data: { list: grammarList, total: grammarTotal } }) => {
        this.setState({ grammarQuery, grammarTotal, grammarList });
      }
    })
  }
  saveGrammar() {
    const { curGrammar } = this.state;
    if (!curGrammar.grammar) {
      message.warn('文法を必ずご入力になってください。');
      return;
    }
    FetchUtil.post({
      url: '/grammar/save',
      data: this.state.curGrammar,
      success: () => {
        this.grammarPage();
        this.setState({ showDrawer: false });
        message.success('セーブ完了');
      }
    })
  }
  delGrammar(grammarId) {
    FetchUtil.delete({
      url: `/grammar/${grammarId}/delete`,
      success: () => {
        this.grammarPage();
        message.success('デリート完了');
      }
    })
  }
  openOperateDrawer(grammar) {
    const curGrammar = { ...grammar };
    if (!curGrammar.level) {
      curGrammar.level = 'N1';
    }
    this.setState({ curGrammar, showDrawer: true });
  }
  closeOperateDrawer() {
    this.setState({ showDrawer: false, curGrammar: {} });
  }
  openExampleDrawer(grammar) {
    const curGrammar = { ...grammar };
    FetchUtil.get({
      url: `/example/${grammar.id}/list`,
      success: ({ data: exampleList }) =>
        this.setState({ curGrammar, showExample: true, exampleList })
    })
  }
  closeExampleDrawer() {
    this.setState({ showExample: false, curGrammar: {}, exampleList: [], editExampleId: 0, });
  }
  saveExample() {
    const { curExample, exampleList, curGrammar: { id } } = this.state;
    if (!curExample.content) {
      message.warn('例文を必ずご入力になってください。');
      return;
    }
    curExample.grammarId = id;
    FetchUtil.post({
      url: '/example/save',
      data: curExample,
      success: ({ data: exampleId }) => {
        let exampleIndex = 0;
        if (!!curExample.id) {
          exampleIndex = exampleList.findIndex(example => example.id === curExample.id);
        }
        curExample.id = exampleId;
        const nextExampleList = [...exampleList];
        nextExampleList.splice(exampleIndex, 1, curExample);
        this.setState({ editExampleId: 0, curExample: {}, exampleList: nextExampleList });
      }
    })
  }
  delExample(exampleId) {
    const { exampleList } = this.state;
    if (!exampleId) {
      exampleList.shift();
      this.setState({ editExampleId: 0, curExample: {}, exampleList: [...exampleList] });
      return;
    }
    FetchUtil.delete({
      url: `/example/${exampleId}/delete`,
      success: () => {
        exampleList.splice(exampleList.findIndex(example => example.id === exampleId), 1);
        this.setState({ editExampleId: 0, curExample: {}, exampleList: [...exampleList] });
      }
    })
  }
  updateExample(example) {
    if (this.state.editExampleId === 0) {
      this.setState({ editExampleId: example.id, curExample: { ...example } })
    }
  }
  editExample(attr, value) {
    const { curExample } = this.state;
    curExample[attr] = value;
    this.setState({ curExample });
  }
  cancelUpdateExample(isPlus) {
    const { exampleList } = this.state;
    if (isPlus) {
      exampleList.shift();
    }
    this.setState({ editExampleId: 0, curExample: {}, exampleList: [...exampleList] });
  }
  plusExample() {
    if (this.state.editExampleId === 0) {
      this.setState({ editExampleId: -1, exampleList: [{}, ...this.state.exampleList], curExample: {} });
    }
  }
  entryGrammarQuery(attr, value) {
    const { grammarQuery } = this.state;
    grammarQuery[attr] = value;
    this.setState({ grammarQuery })
  }
  entryGrammar(attr, value) {
    const { curGrammar } = this.state;
    curGrammar[attr] = value;
    this.setState({ curGrammar })
  }
  componentWillMount() {
    this.grammarPage();
  }
  render() {
    const { grammarTotal, grammarQuery, grammarList, showDrawer, curGrammar, showExample, exampleList, editExampleId, curExample } = this.state;
    const columns = [
      {
        title: 'ラベル',
        dataIndex: 'level',
        key: 'level',
        render: text => <Tag color="blue">{text}</Tag>,
      },
      {
        title: '文法',
        dataIndex: 'grammar',
        key: 'grammar',
        render: (text, record) => <Tooltip title={record.point}>
          <Button type="link">{text}</Button>
        </Tooltip>,
      },
      {
        title: '場合',
        dataIndex: 'occasion',
        key: 'occasion'
      },
      {
        title: '接続',
        dataIndex: 'grounding',
        key: 'grounding',
        render: text => <Alert message={text} type="success" />
      },
      {
        title: '意味',
        dataIndex: 'meanChinese',
        key: 'meanChinese'
      },
      {
        title: '操作',
        key: 'action',
        render: (text, record) => (
          <Space size="middle">
            <Button type="dashed" onClick={() => this.openOperateDrawer(record)} shape="circle" icon={<FormOutlined />} />
            <Button type="dashed" onClick={() => this.openExampleDrawer(record)} shape="circle" icon={<UnorderedListOutlined />} />
            <Popconfirm
              title="削除するか？"
              onConfirm={() => this.delGrammar(record.id)}
              okText="はい"
              cancelText="いえ"
            >
              <Button danger type="dashed" shape="circle" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ];
    const exampleColumns = [{
      title: '例文',
      dataIndex: 'content',
      key: 'content',
      render: (text, { id }) => {
        if (!id || id === editExampleId) {
          return <Input.TextArea autoSize value={curExample.content} onChange={e => this.editExample('content', e.target.value)} maxLength={128} />
        }
        return text;
      }
    }, {
      title: '意味',
      dataIndex: 'meanChinese',
      key: 'meanChinese',
      render: (text, { id }) => {
        if (!id || id === editExampleId) {
          return <Input.TextArea autoSize value={curExample.meanChinese} onChange={e => this.editExample('meanChinese', e.target.value)} maxLength={128} />
        }
        return text;
      }
    }, {
      title: '著者',
      dataIndex: 'creator',
      key: 'creator',
      render: (text, { id }) => {
        if (!id || id === editExampleId) {
          return <Input value={curExample.creator} onChange={e => this.editExample('creator', e.target.value)} maxLength={8} />
        }
        return text;
      }
    }, {
      title: <div>
        操作
        <Button style={{ marginLeft: 10 }} type="dashed" shape="circle" icon={<PlusOutlined />}
          onClick={() => this.plusExample()} />
      </div>,
      dataIndex: 'id',
      key: 'id',
      render: (text, record) => (
        <Space size="middle">
          {
            !text || text === editExampleId ?
              <div style={{ display: 'flex' }}>
                <Button type="dashed" onClick={() => this.saveExample()} shape="circle" icon={<SaveOutlined />} />
                <Button type="dashed" onClick={() => this.cancelUpdateExample(!text)} shape="circle" icon={<CloseCircleOutlined />} />
              </div>
              :
              <Button type="dashed" onClick={() => this.updateExample(record)} shape="circle" icon={<FormOutlined />} />
          }
          {
            !!text ? <Popconfirm
              title="削除するか？"
              onConfirm={() => this.delExample(text)}
              okText="はい"
              cancelText="いえ"
            >
              <Button danger type="dashed" shape="circle" icon={<DeleteOutlined />} />
            </Popconfirm> : null
          }
        </Space>
      )
    }];
    return (
      <div className="App">
        <Space direction="vertical">
          <Card title="JLPT文法" style={{ width: '100%' }}>
            <Row>
              <Col
                span={8}>
                <Input allowClear style={{ width: 120 }} placeholder="キーワード" value={grammarQuery.grammar}
                  onChange={e => this.entryGrammarQuery('grammar', e.target.value.trim())} />
              </Col>
              <Col span={8}>
                <Select style={{ width: 120 }} allowClear
                  onChange={value => this.entryGrammarQuery('level', value)}>
                  <Option value="N1">N1</Option>
                  <Option value="N2">N2</Option>
                </Select>
              </Col>
              <Col span={8}>
                <Space>
                  <Button type="primary" icon={<SearchOutlined />} onClick={() => this.grammarPage(true)}>
                    サーチ
                  </Button>
                  <Button type="dashed" shape="circle" icon={<PlusOutlined />} onClick={() => this.openOperateDrawer({})} />
                </Space>
              </Col>
            </Row>
            <Divider />
            <Table columns={columns} dataSource={grammarList}
              rowKey={(item) => item.id}
              pagination={{
                showSizeChanger: false,
                current: grammarQuery.current,
                pageSize: grammarQuery.pageSize,
                total: grammarTotal,
                showTotal: total => `合計　${total}　件`,
                onChange: page => {
                  grammarQuery.current = page;
                  this.setState({ grammarQuery });
                  this.grammarPage();
                }
              }}
            />
          </Card>
        </Space>
        <Drawer visible={showExample} width={720} title={curGrammar.grounding}
          onClose={() => this.closeExampleDrawer()} placement={'left'}>
          <Table columns={exampleColumns} dataSource={exampleList} pagination={false} rowKey={(item) => item.id || 0} />
        </Drawer>
        <Drawer visible={showDrawer} width={580} title={`文法を${!curGrammar.id ? 'クリエート' : 'アップディト'}`}
          onClose={() => this.closeOperateDrawer()}
          footer={
            <div
              style={{
                textAlign: 'right',
              }}
            >
              <Button onClick={() => this.closeOperateDrawer()} style={{ marginRight: 8 }}>
                キャンセル
              </Button>
              <Button type="primary" onClick={() => this.saveGrammar()}>
                セーブ
              </Button>
            </div>}>
          <Row gutter={16}>
            <Col span={24}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  文法
                </div>
                <Input placeholder="文法を入力" value={curGrammar.grammar}
                  onChange={(e) => this.entryGrammar('grammar', e.target.value)} maxLength={16} />
              </Space>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  レベル
                </div>
                <Select defaultValue='N1' value={curGrammar.level} style={{ width: '100%' }}
                  onChange={value => this.entryGrammar('level', value)}>
                  <Option value="N1">N1</Option>
                  <Option value="N2">N2</Option>
                </Select>
              </Space>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  接続
                </div>
                <Input rows={4} placeholder="接続を入力" value={curGrammar.grounding}
                  onChange={(e) => this.entryGrammar('grounding', e.target.value)} maxLength={128} />
              </Space>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  場合
                </div>
                <Input placeholder="場合を入力" value={curGrammar.occasion}
                  onChange={(e) => this.entryGrammar('occasion', e.target.value)} maxLength={8} />
              </Space>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  意味
                </div>
                <Input placeholder="意味を入力" value={curGrammar.meanChinese}
                  onChange={(e) => this.entryGrammar('meanChinese', e.target.value)} maxLength={32} />
              </Space>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  ポイント
                </div>
                <Input.TextArea autoSize rows={4} placeholder="ポイントを入力" value={curGrammar.point}
                  onChange={e => this.entryGrammar('point', e.target.value)} maxLength={256} />
              </Space>
            </Col>
          </Row>
        </Drawer>
      </div>
    );
  }
}

export default App;
