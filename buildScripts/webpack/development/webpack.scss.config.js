const fs                   = require('fs'),
      path                 = require('path'),
      MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = env => {
    const config = JSON.parse(fs.readFileSync('./buildScripts/webpack/development/json/' + env.json_file));

    return {
        mode   : 'development',
        devtool: 'inline-source-map',
        entry  : config.entry,

        plugins: [
            new MiniCssExtractPlugin({filename: config.output}) // remove this one to directly insert the result into a style tag
        ],

        output: {
            path    : path.resolve(__dirname, config.buildFolder),
            filename: 'tmpWebpackCss.js'
        },

        module: {
            rules: [{
                test: /\.scss$/,
                use : [
                    'style-loader',
                    MiniCssExtractPlugin.loader,
                    {
                        loader : 'css-loader',
                        options: {
                            importLoaders: 2, // 0 => no loaders (default); 1 => postcss-loader; 2 => postcss-loader, sass-loader
                            sourceMap    : true
                        }
                    },
                    {
                        loader : 'postcss-loader',
                        options: {
                            config   : {
                                path: './buildScripts/webpack/development/'
                            },
                            sourceMap: true
                        }
                    },
                    'sass-loader'
                ]
            }]
        }
    }
};