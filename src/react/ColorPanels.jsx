const ColorPanels = props => {
  // for loading
  const colors = [
    'rgba(255, 0, 0, 0.65)', // red
    'rgba(255, 165, 0, 0.65)', // orange
    'rgba(173, 216, 230, 0.65)', // blue
    'rgba(0, 128, 0, 0.65)', // green
    'rgba(255, 255, 0, 0.65)', // yellow
    'rgba(0, 0, 255, 0.65)', // blue
    'rgba(75, 0, 130, 0.65)', // indigo
  ].reverse();

  const handlePanelClick = id => {
    console.log(id);
    props.setSelectedId(id); // Update the selected panel ID
  };

  useEffect(() => {}, [props.selectedId]);
  return (
    <div className="panel-container">
      <div className="grid-container">
        {colors.slice(1).map((color, index) => (
          <div
            key={index}
            className={`color-panel ${props.selectedId === index + 1 ? 'selected' : ''} ${props.selectedId !== null && props.selectedId !== index + 1 ? 'greyed-out' : ''}`}
            style={{
              backgroundImage:
                props.colored &&
                props.colored.slice(1, props.colored.length)[index] > 0
                  ? `url(${planePanels[index]})`
                  : '',
              backgroundColor: props.colored
                ? props.colored.slice(1, props.colored.length - 1)[index] > 0
                  ? color
                  : 'grey'
                : color,
            }}
            onClick={() => {
              if (props.market) {
                props.setRequestId(
                  props.requests.slice(1, props.requests.length)[index]
                );
                props.setPrice(
                  props.prices.slice(1, props.prices.length)[index]
                );
              }
              props.setPlane && props.setPlane(planePanels[index]);
              if (
                props.colored &&
                props.colored.slice(1, props.colored.length)[index] > 0
              )
                handlePanelClick(index + 1);
              else if (!props.colored) handlePanelClick(index + 1);
            }}
          >
            {props.market == true &&
              props.colored &&
              props.colored.slice(1, props.colored.length)[index] > 0 &&
              props.colored.slice(1, props.colored.length)[index]}
            <span style={{ fontSize: '10px' }}>
              {props.names && props.names[index] && props.names[index][0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export { ColorPanels };
