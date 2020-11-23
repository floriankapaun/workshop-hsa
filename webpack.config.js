const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env) => {
    const mode = env.mode;

    const config = {
        mode: mode,
        entry: {
            app: './src/js/main.js',
            main: './src/css/main.css',
        },
        devServer: {
            contentBase: './dist',
            port: 9000,
        },
        module: {
            rules: [
                {
                    test: /\.handlebars$/,
                    loader: 'handlebars-loader',
                },
                {
                    test: /\.(sa|sc|c)ss$/,
                    use: [
                        mode === 'development' ? 'style-loader' : MiniCssExtractPlugin.loader,
                        'css-loader',
                        // 'postcss-loader',
                        // 'sass-loader',
                    ],
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/,
                    use: [
                        'file-loader',
                    ],
                },
            ],
        },
        plugins: [
            new CleanWebpackPlugin(),
            new HtmlWebpackPlugin({
                title: 'HIGHLAIGHT',
                template: 'src/index.handlebars',
                templateParameters: {
                    title: 'HIGHLAIGHT',
                },
                scriptLoading: 'defer',
                hash: true,
            }),
        ],
        output: {
            filename: '[name].bundle.js',
            path: path.resolve(__dirname, 'dist'),
            publicPath: '',
        },
    };

    if (mode === 'development') { 
        config.devtool = 'inline-source-map';
    } else if (mode === 'production') {
        config.plugins.push(new MiniCssExtractPlugin());
    }

    return config;
};
