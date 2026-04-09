
const FooterForDashboard = () => {
    return (
        <div className="flex flex-wrap items-center md:justify-between justify-center">
        <div className="w-full md:w-4/12 px-4 mx-auto text-center">
            <div className="text-sm text-blueGray-500 font-semibold py-1">
                Copyright © <span id="get-current-year">2024</span>
                <a
                    href="https://www.creative-tim.com/product/notus-js"
                    className="text-blueGray-500 hover:text-gray-800"
                    target="_blank"
                />{" "}
                Developed & Secured by
                <a
                    href="https://www.newtonsapple.in"
                    className="text-blueGray-500 hover:text-blueGray-800"
                >
                     Newtons Apple Security Solutions
                </a>
                .
            </div>
        </div>
    </div>
    );
};

export default FooterForDashboard;
