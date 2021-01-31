const {
  FlexibleXYPlot,
  XAxis,
  YAxis,
  ChartLabel,
  HorizontalGridLines,
  VerticalGridLines,
  LineSeries,
  LineSeriesCanvas,
  Crosshair,
  LabelSeries
} = reactVis;

const { useState } = React;

const {
  Dropdown,
  DropdownButton,
  MenuItem,
  Image,
  FormControl
} = ReactBootstrap;

/* Size of graph on screen */
const screenScale = 0.8;
const graphSize =
  screenScale * screen.width > 1000 ? 1000 : screenScale * screen.width;

/* max classes that can be shown on the graph and the colors of those classes' lines */
const max_classes = 3;
const colors = ["#2e59a8", "#73a2c6", "#0099CC"];

/* array of class names */
let CLASSES_SPRING = [];
/* array of % of class full for every time (json objects) */
let DATA_SPRING = [];
/* array of # of class full for every time (json objects) */
let SEATS_FILLED_SPRING = [];
/* dates scraped */
let DATES_SPRING = [];
/* array of total seats for ecah class */
let TOTAL_SEATS_SPRING = [];
/* index of the time of second pass */
const YEARS_SPRING = ["Junior", "Sophomore", "Freshman"];
const MISSING_DATES_SPRING = [166, 209];
const FIRST_PASS_DATES_SPRING = [74, 100, 120];
const SECOND_PASS_DATES_SPRING = [180, 258, 280];
const SECOND_PASS_DATE_SPRING = 164;
const PASS_DATES_SPRING = FIRST_PASS_DATES_SPRING.concat(SECOND_PASS_DATE_SPRING, SECOND_PASS_DATES_SPRING);

const LAST_DATE_SPRING = 288;

/* custom menu component to allow searching for classes */
const CustomMenu = React.forwardRef(
  ({ children, style, className, "aria-labelledby": labeledBy }, ref) => {
    const [value, setValue] = useState("");

    return (
      <div
        ref={ref}
        style={style}
        className={className}
        aria-labelledby={labeledBy}
      >
        <FormControl
          autoFocus
          className="mx-3 my-2 w-auto"
          placeholder="Type to filter..."
          onChange={e => setValue(e.target.value)}
          value={value}
        />
        <div style={{ overflowY: "scroll", height: "200px" }}>
          <ul className="list-unstyled">
            {React.Children.toArray(children).filter(
              child =>
                !value ||
                child.props.children.toLowerCase().includes(value.toLowerCase())
            )}
          </ul>
        </div>
      </div>
    );
  }
);

/* tick formatter for the X axis labels */
function tickFormatter(t) {
  return (
    <tspan>
      <tspan x="0" dy="1em">
        {DATES[t].split(" ")[0]} {DATES[t].split(" ")[1]}
      </tspan>
      <tspan x="0" dy="1em">
        {DATES[t].split(" ")[2]} {DATES[t].split(" ")[3]}
      </tspan>
    </tspan>
  );
}

/*
Main things we are rendering:
Dropdown Menu (to select classes)
Class boxes (click on them to delete a class)
Chart
  labels
  lines of classes
  special lines (second pass, full)
  Crosshair
Class Info Boxes
*/
class Chart2 extends React.Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {
      useCanvas: false,
      classOnGraph: [],
      mouseY: 0,
      showClass: [],
      dropdownClasses: [],
      removeDropdownClasses: [],
      numClassesShown: 0,
      isMobile: graphSize == screenScale * screen.width ? true : false,
      graphSize: graphSize,
      //THIS LOADING IS HARDCODED BY # OF FILES WE Load
      loading_spring: 5,
      showAcademicYearLines: true,
      showMissingDataLines:true,
      classHeader: ""
    };
    this._showAcademicYearLines = this._showAcademicYearLines.bind(this);
  }

  /* updates the dimensions of the chart based on screen size */
  updateDimensions() {
    this.setState({
      graphSize:
        screenScale * screen.width > 1000 ? 1000 : screenScale * screen.width
    });
    this.setState({
      isMobile:
        this.state.graphSize == screenScale * screen.width ? true : false
    });
  }

  /* these fetch functions get the data from their json files */
  fetchData() {
    fetch("../../../../datasets/class-fill-ups-2/pct_data_spring.json")
      .then(res => {
        return res.json();
      })
      .then(text => {
        text = JSON.stringify(text, function(key, value) {
          // limit precision of floats
          if (typeof value === "number") {
            return parseFloat(value.toFixed(2));
          }
          return value;
        });
        text = JSON.parse(text);
        DATA_SPRING = text;
        if (this._isMounted) this.dataLoaded();
      });
  }

  fetchClasses() {
    fetch("../../../../datasets/class-fill-ups-2/class_names_spring.json")
      .then(res => {
        return res.json();
      })
      .then(text => {
        CLASSES_SPRING = text;
        if (this._isMounted) this.dataLoaded();
      });
  }

  fetchSeats() {
    fetch("../../../../datasets/class-fill-ups-2/seats_filled_data_spring.json")
      .then(res => {
        return res.json();
      })
      .then(text => {
        SEATS_FILLED_SPRING = text;
        if (this._isMounted) this.dataLoaded();
      });
  }

  fetchDates() {
    fetch("../../../../datasets/class-fill-ups-2/dates_spring.json")
      .then(res => {
        return res.json();
      })
      .then(text => {
        DATES_SPRING = text;
        if (this._isMounted) this.dataLoaded();
      });
  }

  fetchTotalSeats() {
    fetch("../../../../datasets/class-fill-ups-2/total_seats_spring.json")
      .then(res => {
        return res.json();
      })
      .then(text => {
        TOTAL_SEATS_SPRING = text;
        if (this._isMounted) this.dataLoaded();
      });
  }

  dataLoaded() {
    let loading_spring = this.state.loading_spring - 1;
    this.setState({ loading_spring: loading_spring });
    if (loading_spring == 0) {
      this._createDropdownClasses();
    }
  }

  componentDidMount() {
    this._isMounted = true;
    const fetchClasses_SPRING = this.fetchClasses();
    const fetchData_SPRING = this.fetchData();
    const fetchDates_SPRING = this.fetchDates();
    const fetchSeats_SPRING = this.fetchSeats();
    const fetchTotalSeats_SPRING = this.fetchTotalSeats();
    Promise.all([
      fetchClasses_SPRING,
      fetchData_SPRING,
      fetchDates_SPRING,
      fetchSeats_SPRING,
      fetchTotalSeats_SPRING
    ]);
    window.addEventListener("resize", this.updateDimensions.bind(this));
  }

  componentWillUnmount() {
    this._isMounted = false;
    window.removeEventListener("resize", this.updateDimensions.bind(this));
  }

  /* adds all the classes to the dropdown menu */
  _createDropdownClasses() {
    let showClass = new Array(CLASSES_SPRING.length).fill(false);
    this.setState({ showClass: showClass });

    let dropdownClasses = this.state.dropdownClasses;
    for (let i = 0; i < CLASSES_SPRING.length; i++) {
      let div = (
        <Dropdown.Item key={CLASSES_SPRING[i]} onClick={this._showClass.bind(null, i)}>
          {CLASSES_SPRING[i]}
        </Dropdown.Item>
      );
      dropdownClasses.push(div);
    }
    this.setState({ dropdownClasses: dropdownClasses });
  }

  /* used to track mouse position for the crosshair */
  _onNearestX = (value, { index }) => {
    this.setState({ classOnGraph: DATA_SPRING.map(d => d[index]) });
    //THIS 270 IS HARDCODED IDK WHY WE NEED TO SUBTRACT BY 270
    this.setState({ mouseY: window.event.clientY - 270 });
  };

  /* shows the classes selected */
  _showClass = class_num => {
    let { numClassesShown, showClass, isMobile } = this.state;
    let removeDropdownClasses = [];

    let displayMobile = isMobile ? "" : "inline";
    if (numClassesShown < max_classes) {
      if (showClass[class_num] == false) {
        showClass[class_num] = true;
        numClassesShown += 1;
        let xbutton = (
          <Image
            src="../../../../img/posts/class-fill-ups/xbutton.png"
            roundedCircle
          />
        );
        let colorNum = 0;
        for (let i = 0; i < CLASSES_SPRING.length; i++) {
          if (showClass[i]) {
            let div = (
              <div
                style={{
                  minWidth: 120,
                  borderRadius: "10px",
                  border: "2px solid",
                  borderColor: colors[colorNum],
                  padding: 10,
                  marginBottom: 10,
                  display: displayMobile,
                  marginRight: 50
                }}
              >
                {CLASSES_SPRING[i]}
                <a
                  style={{ paddingLeft: 10, cursor: "pointer" }}
                  onClick={this._removeClass.bind(null, i)}
                >
                  {xbutton}
                </a>
              </div>
            );
            removeDropdownClasses.push(div);
            colorNum++;
          }
        }

        let date_filled = DATA_SPRING[class_num].findIndex(x => x.y == 100);
        let classHeader =
          date_filled == -1 ? (
            <h3 style={{ textAlign: "center", marginTop: "20px" }}>
              {CLASSES_SPRING[class_num]} never filled up!
            </h3>
          ) : (
            <h3 style={{ textAlign: "center", marginTop: "20px" }}>
              {CLASSES_SPRING[class_num]} filled up after {DATES_SPRING[date_filled]}
            </h3>
          );

        this.setState({
          showClass: showClass,
          numClassesShown: numClassesShown,
          removeDropdownClasses: removeDropdownClasses,
          classHeader: classHeader
        });
      }
    }
  };

  /* removes a class when its x is clicked */
  _removeClass = class_num => {
    let { numClassesShown, showClass, isMobile, classHeader } = this.state;
    let removeDropdownClasses = [];

    showClass[class_num] = false;
    numClassesShown -= 1;
    let aClassShown = false;

    let displayMobile = isMobile ? "" : "inline";
    let xbutton = (
      <Image
        src="../../../../img/posts/class-fill-ups/xbutton.png"
        roundedCircle
      />
    );
    let colorNum = 0;
    for (let i = 0; i < CLASSES_SPRING.length; i++) {
      if (showClass[i]) {
        aClassShown = true;
        let div = (
          <div
            style={{
              minWidth: 120,
              borderRadius: "10px",
              border: "2px solid",
              borderColor: colors[colorNum],
              padding: 10,
              marginBottom: 10,
              display: displayMobile,
              marginRight: 50
            }}
          >
            {CLASSES_SPRING[i]}
            <a
              style={{ paddingLeft: 10, cursor: "pointer" }}
              onClick={this._removeClass.bind(null, i)}
            >
              {xbutton}
            </a>
          </div>
        );
        removeDropdownClasses.push(div);
        colorNum++;
      }
    }

    if (!aClassShown) {
      classHeader = null;
    }
    this.setState({
      showClass: showClass,
      numClassesShown: numClassesShown,
      removeDropdownClasses: removeDropdownClasses,
      classHeader: classHeader
    });
  };

  _showAcademicYearLines() {
    let showAcademicYearLines = this.state.showAcademicYearLines;
    showAcademicYearLines = !showAcademicYearLines;
    this.setState({ showAcademicYearLines: showAcademicYearLines });
  }

  render() {
    const { useCanvas } = this.state;
    const Line = useCanvas ? LineSeriesCanvas : LineSeries;
    const lineSize = "4px";
    const {
      classOnGraph,
      mouseY,
      showClass,
      dropdownClasses,
      removeDropdownClasses,
      isMobile,
      graphSize,
      loading_spring,
      showAcademicYearLines,
      showMissingDataLines,
      classHeader
    } = this.state;

    let classInfoBox = [];
    let lines = [];
    let academicYearLines = [];
    let missingDataLines = [];
    let classShown = false;
    let colorNum = 0;

    /* creates all the lines of the classes */
    for (let i = 0; i < CLASSES_SPRING.length; i++) {
      if (showClass[i]) {
        let div = (
          <Line
            key={CLASSES_SPRING[i]}
            strokeWidth={lineSize}
            data={DATA_SPRING[i]}
            onNearestX={this._onNearestX}
            color={colors[colorNum]}
          />
        );
        lines.push(div);
        classShown = true;
        colorNum++;
      }
    }

    /* creates the class info box on the right */
    if (classOnGraph[0]) {
      let padding = 50;
      let div = (
        <div style={{ paddingLeft: padding }}>
          {isMobile ? (
            <h4 style={{ width: "max-content" }}>
              {DATES_SPRING[classOnGraph[0].x]} passed
            </h4>
          ) : (
            <h2 style={{ width: "max-content" }}>
              {DATES_SPRING[classOnGraph[0].x]} passed
            </h2>
          )}
        </div>
      );
      classInfoBox.push(div);

      colorNum = 0;
      for (let i = 0; i < CLASSES_SPRING.length; i++) {
        if (showClass[i]) {
          let date_filled = DATA_SPRING[i].findIndex(x => x.y == 100);
          let div = (
            <div style={{ paddingLeft: padding }}>
              {isMobile ? (
                <h4 style={{ width: "max-content", color: colors[colorNum] }}>
                  {CLASSES_SPRING[i]}
                </h4>
              ) : (
                <h3 style={{ width: "max-content", color: colors[colorNum] }}>
                  {CLASSES_SPRING[i]}
                </h3>
              )}
              <p style={{ marginBottom: "0px" }}>
                Percent Full: {classOnGraph[i].y}%
              </p>
              <p style={{ marginBottom: "0px" }}>
                Seats Filled: {SEATS_FILLED_SPRING[i][classOnGraph[0].x].y}
              </p>
              <p style={{ marginBottom: "0px" }}>
                Total Seats: {TOTAL_SEATS_SPRING[i]}
              </p>
              {date_filled == -1 ? (
                <p>{CLASSES_SPRING[i]} never filled up!</p>
              ) : (
                <p>
                  {CLASSES_SPRING[i]} filled up after {DATES_SPRING[date_filled]}
                </p>
              )}
            </div>
          );
          classInfoBox.push(div);
          colorNum++;
        }
      }
    }

    if (showAcademicYearLines) {
      for (let i = 0; i < YEARS_SPRING.length; i++) {
        academicYearLines.push(
          <Line
            key={"firstPass" + YEARS_SPRING[i]}
            className={"firstPass" + YEARS_SPRING[i]}
            color="gray"
            style={{
              strokeDasharray: "2 2"
            }}
            data={[
              { x: FIRST_PASS_DATES_SPRING[i], y: 0 },
              { x: FIRST_PASS_DATES_SPRING[i], y: 100 }
            ]}
          />
        );
        academicYearLines.push(
          <LabelSeries
            key={"firstPass" + YEARS_SPRING[i] + "Label"}
            className={"firstPass" + YEARS_SPRING[i] + "Label"}
            labelAnchorX="middle"
            style={{ opacity: 0.6 }}
            data={[
              {
                x: FIRST_PASS_DATES_SPRING[i],
                y: 74 - 8 * i,
                label: YEARS_SPRING[i]
              }
            ]}
          />
        );
        academicYearLines.push(
          <Line
            key={"secondPass" + YEARS_SPRING[i]}
            className={"secondPass" + YEARS_SPRING[i]}
            color="gray"
            style={{
              strokeDasharray: "2 2"
            }}
            data={[
              { x: SECOND_PASS_DATES_SPRING[i], y: 0 },
              { x: SECOND_PASS_DATES_SPRING[i], y: 100 }
            ]}
          />
        );
        academicYearLines.push(
          <LabelSeries
            key={"secondPass" + YEARS_SPRING[i] + "Label"}
            className={"secondPass" + YEARS_SPRING[i] + "Label"}
            labelAnchorX="middle"
            style={{ opacity: 0.6 }}
            data={[
              {
                x: SECOND_PASS_DATES_SPRING[i],
                y: 74 - 8 * 4 - 8 * i,
                label: YEARS_SPRING[i]
              }
            ]}
          />
        );
      }
      academicYearLines.push(
        <Line
          key="secondPass"
          className="secondPass"
          color="gray"
          style={{
            strokeDasharray: "2 2"
          }}
          data={[
            { x: SECOND_PASS_DATE_SPRING, y: 0 },
            { x: SECOND_PASS_DATE_SPRING, y: 100 }
          ]}
        />
      );
      academicYearLines.push(
        <LabelSeries
          key="secondPassLabel"
          className="secondPassLabel"
          labelAnchorX="middle"
          style={{ opacity: 0.6 }}
          data={[
            {
              x: SECOND_PASS_DATE_SPRING,
              y: 50,
              label: "Second Pass"
            }
          ]}
        />
      );
    }

    if (showMissingDataLines) {
      for (let i = 0; i < MISSING_DATES_SPRING.length; i++) {
        missingDataLines.push(
          <Line
            key={"firstPass" + MISSING_DATES_SPRING[i]}
            className={"firstPass" + MISSING_DATES_SPRING[i]}
            color="black"
            style={{

            }}
            data={[
              { x: MISSING_DATES_SPRING[i], y: 0 },
              { x: MISSING_DATES_SPRING[i], y: 100 }
            ]}
          />
        );
      }
      missingDataLines.push(
        <LabelSeries
          key="missingDataLabel"
          className="secondPassLabel"
          labelAnchorX="middle"
          // style={{ opacity: 0.8 }}
          data={[
            {
              x: (MISSING_DATES_SPRING[0] + MISSING_DATES_SPRING[1]) / 2,
              y: 98,
              label: "Data Not Collected"
            }
          ]}
        />
      );
    }

    /* if all 5 data files haven't been loaded yet, it shows some LOADING text */
    return loading_spring > 0 ? (
      <h1>Graph loading</h1>
    ) : (
      /* dropdown menu */
      <div style={{ paddingTop: "10px", paddingBottom: "20px" }}>
        <div id="dropdown" style={{ paddingBottom: "15px" }}>
          <Dropdown>
            <Dropdown.Toggle>Choose a Class</Dropdown.Toggle>
            <Dropdown.Menu id="dropdown-basic-button" as={CustomMenu}>
              {dropdownClasses}
            </Dropdown.Menu>
          </Dropdown>
        </div>
        {/* Display classes selected*/}
        {removeDropdownClasses}

        {/* Class Header*/}
        {classHeader}
        {/* The Chart*/}
        <div id = "gra"
          style={{
            paddingTop: "30px",
            paddingLeft: "30px",
            display: "flex",
            justifyContent: "flex-start",
            width: graphSize,
            height: graphSize / 2
          }}
        >
          <FlexibleXYPlot>
            <HorizontalGridLines />
            <VerticalGridLines />
            {isMobile ? null : (
              <XAxis tickValues={PASS_DATES_SPRING} tickFormat={tickFormatter} />
            )}
            <YAxis />
            {isMobile ? null : (
              <ChartLabel
                text="Time passed"
                className="alt-x-label"
                includeMargin={false}
                xPercent={0.018}
                yPercent={1.082}
                style={{
                  fontWeight: "bold"
                }}
              />
            )}
            {isMobile ? null : (
              <ChartLabel
                text="Percentage Full"
                className="alt-y-label"
                includeMargin={false}
                xPercent={0.1}
                yPercent={0.08}
                style={{
                  textAnchor: "end",
                  fontWeight: "bold"
                }}
              />
            )}
            {/* Display lines of classes */}
            {lines}
            {/* Display the class full (100%) line */}
            <Line
              key="classFull"
              className="classFull"
              color="#F08080"
              strokeWidth="6px"
              data={[
                { x: 0, y: 100 },
                { x: LAST_DATE_SPRING, y: 100 }
              ]}
            />
            {/* Display the academic year lines*/}
            {isMobile ? null : academicYearLines}
            {/* Display the missing data lines*/}
            {isMobile ? null : missingDataLines}
            {/* xAxis Line to make sure base line is always 0 */}
            <Line
              key="xAxis"
              className="xAxis"
              style={{ opacity: 0 }}
              data={[
                { x: 0, y: 0 },
                { x: LAST_DATE_SPRING, y: 0 }
              ]}
            />

            {/* Display crosshair if a class has been selected */}
            {classShown ? (
              <Crosshair
                values={classOnGraph}
                itemsFormat={values => {
                  let shownLines = [];
                  for (let i = 0; i < CLASSES_SPRING.length; i++) {
                    if (showClass[i]) {
                      let line = {
                        title: CLASSES_SPRING[i],
                        value: classOnGraph[i].y + "%"
                      };
                      shownLines.push(line);
                    }
                  }
                  return shownLines;
                }}
                titleFormat={values => {
                  return { title: "Day", value: DATES_SPRING[classOnGraph[0].x] };
                }}
                style={{
                  line: {},
                  box: { position: "absolute", top: mouseY },
                  title: {}
                }}
              ></Crosshair>
            ) : null}
          </FlexibleXYPlot>
          {/* Display class info box if class been shown*/}
          {classShown ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flexWrap: "nowrap"
              }}
            >
              {classInfoBox}
            </div>
          ) : null}
        </div>
        {isMobile ? null : (
          <button
            style={{
              boxShadow: "inset 0px 1px 0px 0px #97c4fe",
              background:
                "linear-gradient(to bottom, #3d94f6 5%, #1e62d0 100%)",
              backgroundColor: "#3d94f6",
              borderRadius: "6px",
              border: "1px solid #337fed",
              display: "inline-block",
              color: "#ffffff",
              padding: "6px 24px"
            }}
            onClick={this._showAcademicYearLines}
          >
            Toggle pass times
          </button>
        )}
      </div>
    );
  }
}

//export default Chart;
ReactDOM.render(<Chart2 />, document.getElementById("chartMD_spring"));