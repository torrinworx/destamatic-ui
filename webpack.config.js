import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { fileURLToPath } from 'url';

const { transformBabelAST } = await import("destam-dom/transform/htmlLiteral.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
    name: 'destamatic-ui',
    target: 'web',
    stats: 'minimal',
    devtool: 'source-map',
    mode: "development",
    entry: {
        destamatic_ui : './examples/index.jsx'
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'bundle.js',
        clean: true,
    },
    resolve: {
        extensions: ['.html', '.js', '.jsx'],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './examples/index.html',
        }),
    ],
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: [
                            '@babel/plugin-syntax-jsx',
                            () => ({
                                visitor: {
                                    Program: path => {
                                        transformBabelAST(path.node, {jsx_auto_import: {}});
                                    }
                                }
                            })
                        ],
                    }
                }
            },
            {
                test: /\.(png|jpg|jpeg|gif|ico|webp|svg)$/,
                include: path.resolve(__dirname, 'examples/assets'),
                type: 'asset/resource',
                generator: {
                    filename: 'assets/images/[name][ext][query]',
                },
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ]
    },
    devServer: {
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        static: {
            directory: path.join(__dirname, 'public'),
        },
        port: 3000,
        hot: false,
        historyApiFallback: true,
        client: {
            overlay: {
                errors: true,
                warnings: false,
            },
            logging: 'error',
        },
    },
};

export default config;
