//https://github.com/Schweigi/assembler-simulator/blob/master/src/ui/controller.js
import * as React from "react";
import { CPU, Memory } from "../emulator";
import { assembler } from "../assembler";
import { flag, numberFilter, selectLine } from ".";
import "./emulator.scss";
import "./fonts.scss";

interface IEmulatorProps {}
interface IEmulatorState {
  cpu: CPU;
  error?: string;
  code: string;
  outputStartIndex: number;
  displayHex: boolean;
  displayInstr: boolean;
  displayA: boolean;
  displayB: boolean;
  displayC: boolean;
  displayD: boolean;
  speed: number;
  mapping: any;
  labels: any;
  isRunning: boolean;
}

const speeds = [
  { speed: 1, desc: "1 HZ" },
  { speed: 4, desc: "4 HZ" },
  { speed: 8, desc: "8 HZ" },
  { speed: 16, desc: "16 HZ" },
  { speed: 32, desc: "32 HZ" },
  { speed: 64, desc: "64 HZ" }
];

class Emulator extends React.Component<IEmulatorProps, IEmulatorState> {
  constructor(props: IEmulatorProps) {
    super(props);

    var cpu = new CPU({ memory: new Memory() });
    this.state = {
      cpu,
      code: `; Simple example
; Writes Hello World to the output

        JMP start
hello: DB "Hello World!" ; Variable
       DB 0	; String terminator
start:
       MOV C, hello    ; Point to var
       MOV D, 232	; Point to output
       CALL print
       HLT             ; Stop execution
print:			; print(C:*from, D:*to)
       PUSH A
       PUSH B
       MOV B, 0
.loop:
       MOV A, [C]	; Get char from var
       MOV [D], A	; Write to output
       INC C
       INC D
       CMP B, [C]	; Check if end
       JNZ .loop	; jump if not
       POP B
       POP A
       RET`,
      outputStartIndex: 232,
      displayHex: true,
      displayInstr: true,
      displayA: false,
      displayB: false,
      displayC: false,
      displayD: false,
      speed: 4,
      mapping: [],
      labels: {},
      isRunning: false
    };
  }

  reset() {
    const { cpu } = this.state;
    cpu.reset();
    cpu.memory.reset();
    this.setState({ error: undefined, mapping: [], labels: {} }, () =>
      selectLine(this.refs.sourceCode, -1)
    );
  }

  jumpToLine(index: number) {
    const { mapping } = this.state;
    this.refs.sourceCode.scrollIntoView();
    const selectedLine = mapping[index];
    selectLine(this.refs.sourceCode, selectedLine);
  }

  isInstruction(index: number) {
    const { mapping, displayInstr } = this.state;
    return (
      mapping !== undefined && mapping[index] !== undefined && displayInstr
    );
  }

  getMemoryCellCss(index: number) {
    const { cpu, outputStartIndex } = this.state;
    if (index >= outputStartIndex) {
      return "output-bg";
    } else if (this.isInstruction(index)) {
      return "instr-bg";
    } else if (index > cpu.sp && index <= CPU.maxSP) {
      return "stack-bg";
    } else {
      return "";
    }
  }
  private getMemoryInnerCellStyle(index: number) {
    const { cpu, displayA, displayB, displayC, displayD } = this.state;
    let colors = "red";

    if (index === cpu.ip) {
      colors += " marker-ip";
    }
    if (index === cpu.sp) {
      colors += " marker-sp";
    }
    if (index === cpu.gpr[0] && displayA) {
      colors += " marker-a";
    }
    if (index === cpu.gpr[1] && displayB) {
      colors += " marker-b";
    }
    if (index === cpu.gpr[2] && displayC) {
      colors += " marker-c";
    }
    if (index === cpu.gpr[3] && displayD) {
      colors += " marker-d";
    }
    return {
      "--marker-color": `linear-gradient(to right, ${colors})`
    };
  }
  getMemoryInnerCellCss(index: number) {
    const { cpu, displayA, displayB, displayC, displayD } = this.state;
    let css = "";
    if (index === cpu.ip) {
      css += " marker-ip";
    }
    if (index === cpu.sp) {
      css += " marker-sp";
    }
    if (index === cpu.gpr[0] && displayA) {
      css += " marker-a";
    }
    if (index === cpu.gpr[1] && displayB) {
      css += " marker-b";
    }
    if (index === cpu.gpr[2] && displayC) {
      css += " marker-c";
    }
    if (index === cpu.gpr[3] && displayD) {
      css += " marker-d";
    }

    return css.length === 0 ? "" : "marker " + css;
  }
  getChar(value: number) {
    if (value > 0) {
      const char = String.fromCharCode(value);
      if (/\S/.test(char)) {
        return char;
      } else {
        return "\u00A0\u00A0";
      }
    }
    return "\u00A0\u00A0";
  }
  assemble() {
    try {
      const { code, cpu } = this.state;
      this.reset();

      var assembly = assembler.go(code);
      const mapping = assembly.mapping;
      var binary = assembly.code;
      const labels = assembly.labels;

      if (binary.length > cpu.memory.data.length) {
        throw new Error(
          `Binary code does not fit into the memory. Max ${
            cpu.memory.data.length
          } bytes are allowed`
        );
      }

      for (var i = 0, l = binary.length; i < l; i++) {
        cpu.memory.data[i] = binary[i];
      }

      this.setState({ mapping, labels });
    } catch (e) {
      if (e.line !== undefined) {
        this.setState(
          {
            error: `${e.line} | ${e.error}`
          },
          () => selectLine(this.refs.sourceCode, e.line - 1)
        );
      } else {
        this.setState({ error: e.error });
      }
    }
  }

  checkPrgrmLoaded() {
    const {
      cpu: { memory }
    } = this.state;
    for (var i = 0, l = memory.data.length; i < l; i++) {
      if (memory.data[i] !== 0) {
        return true;
      }
    }

    return false;
  }
  executeStep() {
    const { cpu, mapping } = this.state;
    if (!this.checkPrgrmLoaded()) {
      this.assemble();
    }

    try {
      // Execute
      var res = cpu.step();

      // Mark in code
      if (cpu.ip in mapping) {
        const selectedLine = mapping[cpu.ip];
        selectLine(this.refs.sourceCode, selectedLine);
      }
      this.setState({});
      return res;
    } catch (e) {
      this.setState({ error: e.message });
      return false;
    }
  }
  runner = null;
  run() {
    const { speed } = this.state;
    if (!this.checkPrgrmLoaded()) {
      //this.assemble();
    }

    this.setState({ isRunning: true });
    this.runner = setTimeout(() => {
      if (this.executeStep() === true) {
        this.run();
      } else {
        this.setState({ isRunning: false });
      }
    }, 1000 / speed);
  }

  stop() {
    clearTimeout(this.runner);
    this.setState({ isRunning: false });
  }

  render() {
    const {
      cpu,
      error,
      code,
      speed,
      outputStartIndex,
      displayInstr,
      displayHex,
      displayA,
      displayB,
      displayC,
      displayD,
      labels,
      isRunning
    } = this.state;

    return (
      <div>
        <nav
          className="navbar navbar-inverse"
          style={{ backgroundColor: "#428BCA", border: 0, borderRadius: 0 }}
        >
          <div className="container">
            <div className="navbar-header">
              <div className="btn-group">
                {!isRunning && (
                  <button
                    type="button"
                    className="btn btn-success navbar-btn"
                    onClick={() => this.run()}
                  >
                    <span className="glyphicon glyphicon-play" /> Run
                  </button>
                )}
                {isRunning && (
                  <button
                    type="button"
                    className="btn btn-default navbar-btn"
                    onClick={() => this.stop()}
                  >
                    <span className="glyphicon glyphicon-stop" /> Stop
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-default navbar-btn"
                  onClick={() => this.executeStep()}
                  disabled={isRunning}
                >
                  <span className="glyphicon glyphicon-forward" /> Step
                </button>
              </div>
              <button
                type="button"
                className="btn btn-default navbar-btn"
                onClick={() => this.reset()}
              >
                Reset
              </button>
            </div>
            <div className="navbar-header navbar-right">
              <a className="navbar-brand" style={{ color: "#FFFFFF" }}>
                Simple 8-bit Assembler Simulator
              </a>
            </div>
          </div>
        </nav>
        <div className="container">
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="row">
            <div className="col-lg-7 col-md-6">
              <div className="panel panel-default">
                <div className="panel-heading">
                  <h4 className="panel-title">
                    Code{" "}
                    <small>
                      (
                      <a
                        href="https://schweigi.github.io/assembler-simulator/instruction-set.html"
                        rel="noopener noreferrer"
                        target="_blank"
                        style={{ color: "#337AB7" }}
                      >
                        Instruction Set
                      </a>
                      )
                    </small>
                  </h4>
                </div>
                <div className="panel-body">
                  <form>
                    <textarea
                      ref="sourceCode"
                      className="form-control source-code"
                      style={{ marginBottom: 5 }}
                      rows={35}
                      tab-support="true"
                      value={code}
                      onChange={e => this.setState({ code: e.target.value })}
                    />
                    <button
                      type="button"
                      className="btn btn-default"
                      onClick={() => this.assemble()}
                    >
                      Assemble
                    </button>
                  </form>
                </div>
              </div>
            </div>
            <div className="clearfix visible-xs visible-sm" />
            <div className="col-lg-5 col-md-6">
              <div className="panel panel-default">
                <div className="panel-heading">
                  <h4 className="panel-title">Output</h4>
                </div>
                <div className="panel-body lcd">
                  {cpu.memory.data.map(
                    (m, index) =>
                      index >= outputStartIndex && (
                        <div
                          key={`output${index}`}
                          style={{
                            float: "left"
                          }}
                          className="output"
                        >
                          <span>{this.getChar(m)}</span>
                        </div>
                      )
                  )}
                </div>
              </div>
              <div className="panel panel-default">
                <div className="panel-heading">
                  <h4 className="panel-title">CPU & Memory</h4>
                </div>
                <div className="panel-body">
                  <p className="text-muted">Registers / Flags</p>

                  <table className="table table-condensed table-striped">
                    <thead>
                      <tr>
                        <th style={{ textAlign: "center" }}>A</th>
                        <th style={{ textAlign: "center" }}>B</th>
                        <th style={{ textAlign: "center" }}>C</th>
                        <th style={{ textAlign: "center" }}>D</th>
                        <th style={{ textAlign: "center" }}>IP</th>
                        <th style={{ textAlign: "center" }}>SP</th>
                        <th style={{ textAlign: "center" }}>Z</th>
                        <th style={{ textAlign: "center" }}>C</th>
                        <th style={{ textAlign: "center" }}>F</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        style={{ textAlign: "center" }}
                        className="source-code"
                      >
                        <td>
                          <div
                            style={{ margin: "auto" }}
                            className={displayA ? "marker marker-a" : undefined}
                          >
                            <small>
                              {numberFilter(cpu.gpr[0], displayHex)}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div
                            style={{ margin: "auto" }}
                            className={displayB ? "marker marker-b" : undefined}
                          >
                            <small>
                              {numberFilter(cpu.gpr[1], displayHex)}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div
                            style={{ margin: "auto" }}
                            className={displayC ? "marker marker-c" : undefined}
                          >
                            <small>
                              {numberFilter(cpu.gpr[2], displayHex)}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div
                            style={{ margin: "auto" }}
                            className={displayD ? "marker marker-d" : undefined}
                          >
                            <small>
                              {numberFilter(cpu.gpr[3], displayHex)}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div
                            style={{ margin: "auto" }}
                            className="marker marker-ip"
                          >
                            <small>{numberFilter(cpu.ip, displayHex)}</small>
                          </div>
                        </td>
                        <td>
                          <div
                            style={{ margin: "auto" }}
                            className="marker marker-sp"
                          >
                            <small>{numberFilter(cpu.sp, displayHex)}</small>
                          </div>
                        </td>
                        <td>
                          <small>{flag(cpu.zero)}</small>
                        </td>
                        <td>
                          <small>{flag(cpu.carry)}</small>
                        </td>
                        <td>
                          <small>{flag(cpu.fault)}</small>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-muted">RAM</p>
                  <div style={{ width: "29em" }} className="source-code">
                    {cpu.memory.data.map((m, index) => (
                      <div
                        key={`ram${index}`}
                        className={`memory-block ${this.getMemoryCellCss(
                          index
                        )}`}
                      >
                        <div className={this.getMemoryInnerCellCss(index)}>
                          {this.isInstruction(index) ? (
                            <a onClick={() => this.jumpToLine(index)}>
                              <small>{numberFilter(m, displayHex)}</small>
                            </a>
                          ) : (
                            <small>{numberFilter(m, displayHex)}</small>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p style={{ marginTop: 5 }}>
                    <small>
                      <span>Clock speed:</span>
                      <select
                        defaultValue={speed}
                        onChange={e =>
                          this.setState({ speed: parseInt(e.target.value) })
                        }
                      >
                        {speeds.map(x => (
                          <option key={x.speed} value={x.speed}>
                            {x.desc}
                          </option>
                        ))}
                      </select>
                      <span style={{ marginLeft: 5 }}>Instructions:</span>
                      <a
                        onClick={() =>
                          this.setState(state => ({
                            displayInstr: !state.displayInstr
                          }))
                        }
                      >
                        {displayInstr ? "Hide" : "Show"}
                      </a>
                      <span style={{ marginLeft: 5 }}>View:</span>
                      <a
                        onClick={() =>
                          this.setState(state => ({
                            displayHex: !state.displayHex
                          }))
                        }
                      >
                        {displayHex ? "Decimal" : "Hex"}
                      </a>
                      <br />
                      Register addressing:
                      <span style={{ marginLeft: 5 }}>A:</span>
                      <a
                        onClick={() =>
                          this.setState(state => ({
                            displayA: !state.displayA
                          }))
                        }
                      >
                        {displayA ? "Hide" : "Show"}
                      </a>
                      <span style={{ marginLeft: 5 }}>B:</span>
                      <a
                        onClick={() =>
                          this.setState(state => ({
                            displayB: !state.displayB
                          }))
                        }
                      >
                        {displayB ? "Hide" : "Show"}
                      </a>
                      <span style={{ marginLeft: 5 }}>C:</span>
                      <a
                        onClick={() =>
                          this.setState(state => ({
                            displayC: !state.displayC
                          }))
                        }
                      >
                        {displayC ? "Hide" : "Show"}
                      </a>
                      <span style={{ marginLeft: 5 }}>D:</span>
                      <a
                        onClick={() =>
                          this.setState(state => ({
                            displayD: !state.displayD
                          }))
                        }
                      >
                        {displayD ? "Hide" : "Show"}
                      </a>
                    </small>
                  </p>
                </div>
              </div>

              <div className="panel panel-default">
                <div className="panel-heading">
                  <h4 className="panel-title">Labels</h4>
                </div>
                <div className="panel-body source-code">
                  <table className="table table-condensed table-striped codelabels">
                    <tbody>
                      <tr>
                        <th>Name</th>
                        <th>Address</th>
                        <th>Value</th>
                      </tr>
                      {Object.keys(labels)
                        .sort((a, b) => a[0].localeCompare(b[0]))
                        .map(name => (
                          <tr key={name} className="codelabel">
                            <td className="codelabel-name">{name}</td>
                            <td className="codelabel-line">
                              <a onClick={() => this.jumpToLine(labels[name])}>
                                {numberFilter(labels[name], displayHex)}
                              </a>
                            </td>
                            <td className="codelabel-value">
                              {numberFilter(
                                cpu.memory.data[labels[name]],
                                displayHex
                              )}
                              {cpu.memory.data[labels[name]] >= 32 &&
                                cpu.memory.data[labels[name]] <= 126 && (
                                  <span>
                                    ('
                                    {this.getChar(
                                      cpu.memory.data[labels[name]]
                                    )}
                                    ')
                                  </span>
                                )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <hr style={{ marginTop: 10, marginBottom: 10 }} />
          </div>
        </div>
      </div>
    );
  }
}

export default Emulator;
