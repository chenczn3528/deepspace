const CloseIcon = ({size = 48, color = '#444444'}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 1024 1024"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        style={{color}}
    >
        <path
            d="M512 1024A512 512 0 1 1 512 0a512 512 0 0 1 0 1024z m3.008-92.992a416 416 0 1 0 0-832 416 416 0 0 0 0 832zM448 448h128v384H448V448z m0-256h128v128H448V192z"
            fill="currentColor"></path>
    </svg>
);

export default CloseIcon;